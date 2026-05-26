package middleware_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"invoiceflow/database"
	"invoiceflow/middleware"
	"invoiceflow/models"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

const testJWTSecret = "test-secret-for-auth-middleware"

// setupTestDB replaces database.DB with an in-memory SQLite instance for the
// duration of the test. Each test gets a fresh database.
func setupTestDB(t *testing.T) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open in-memory db: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}); err != nil {
		t.Fatalf("migrate User: %v", err)
	}
	database.DB = db
}

// signToken mints a valid JWT whose claims intentionally carry wrong values so
// tests can confirm that context is populated from the DB record, not claims.
func signToken(t *testing.T, userID uint, secret string) string {
	t.Helper()
	claims := &middleware.Claims{
		UserID:   userID,
		TenantID: 999,           // deliberately wrong
		Email:    "stale@wrong", // deliberately wrong
		Role:     "wrong-role",  // deliberately wrong
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}
	tok, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return tok
}

type ctxSnapshot struct {
	userID   uint
	tenantID uint
	email    string
	role     string
}

// runMiddleware fires a GET /test request through AuthMiddleware and returns
// the response recorder, whether the downstream handler executed, and any
// context values captured inside it.
func runMiddleware(t *testing.T, bearerToken string) (resp *httptest.ResponseRecorder, handlerRan bool, ctx ctxSnapshot) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(middleware.AuthMiddleware())
	r.GET("/test", func(c *gin.Context) {
		handlerRan = true

		userID, _ := c.Get("user_id")
		tenantID, _ := c.Get("tenant_id")
		email, _ := c.Get("email")
		role, _ := c.Get("role")

		ctx = ctxSnapshot{
			userID:   userID.(uint),
			tenantID: tenantID.(uint),
			email:    email.(string),
			role:     role.(string),
		}
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	if bearerToken != "" {
		req.Header.Set("Authorization", "Bearer "+bearerToken)
	}
	resp = httptest.NewRecorder()
	r.ServeHTTP(resp, req)
	return
}

// TestAuthMiddleware_InactiveUser_Returns403AndAbortsChain verifies that a
// request from an inactive account is rejected with 403 and that the
// downstream handler is never reached (i.e. the chain is aborted).
func TestAuthMiddleware_InactiveUser_Returns403AndAbortsChain(t *testing.T) {
	setupTestDB(t)
	t.Setenv("JWT_SECRET", testJWTSecret)

	user := models.User{
		TenantID:     1,
		Name:         "Inactive User",
		Email:        "inactive@example.com",
		PasswordHash: "x",
		Role:         "admin",
		IsActive:     true, // created active, then deactivated below
	}
	if err := database.DB.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	// Use a direct column Update (not Updates/Save) so GORM does not skip the
	// zero-value false despite the column having DEFAULT true.
	if err := database.DB.Model(&user).Update("is_active", false).Error; err != nil {
		t.Fatalf("deactivate user: %v", err)
	}

	token := signToken(t, user.ID, testJWTSecret)
	resp, handlerRan, _ := runMiddleware(t, token)

	if resp.Code != http.StatusForbidden {
		t.Errorf("status = %d, want %d (Forbidden)", resp.Code, http.StatusForbidden)
	}

	if handlerRan {
		t.Error("downstream handler must not be called when account is inactive")
	}

	// Response body should describe the reason.
	var body map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode response body: %v", err)
	}
	if msg, _ := body["message"].(string); msg == "" {
		t.Errorf("expected non-empty message field in response body, got %v", body)
	}
}

// TestAuthMiddleware_ActiveUser_SetsContextFromDB verifies that a valid token
// for an active user allows the request through and that every context key
// (user_id, tenant_id, email, role) is sourced from the database record, not
// from the JWT claims (which carry deliberately stale values).
func TestAuthMiddleware_ActiveUser_SetsContextFromDB(t *testing.T) {
	setupTestDB(t)
	t.Setenv("JWT_SECRET", testJWTSecret)

	user := models.User{
		TenantID:     42,
		Name:         "Active User",
		Email:        "active@example.com",
		PasswordHash: "x",
		Role:         "admin",
		IsActive:     true,
	}
	if err := database.DB.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}

	token := signToken(t, user.ID, testJWTSecret)
	resp, handlerRan, ctx := runMiddleware(t, token)

	if resp.Code != http.StatusOK {
		t.Errorf("status = %d, want %d (OK)", resp.Code, http.StatusOK)
	}
	if !handlerRan {
		t.Error("downstream handler must be called for an active user")
	}

	// All values must come from the DB, not from the stale JWT claims.
	if ctx.userID != user.ID {
		t.Errorf("user_id = %d, want %d", ctx.userID, user.ID)
	}
	if ctx.tenantID != user.TenantID {
		t.Errorf("tenant_id = %d, want %d (JWT claimed 999)", ctx.tenantID, user.TenantID)
	}
	if ctx.email != user.Email {
		t.Errorf("email = %q, want %q (JWT claimed stale@wrong)", ctx.email, user.Email)
	}
	if ctx.role != user.Role {
		t.Errorf("role = %q, want %q (JWT claimed wrong-role)", ctx.role, user.Role)
	}
}
