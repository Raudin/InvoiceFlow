package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"invoiceflow/database"
	"invoiceflow/middleware"
	"invoiceflow/models"
	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type RegisterRequest struct {
	BusinessName string `json:"business_name" binding:"required,max=150"`
	Name         string `json:"name" binding:"required,max=120"`
	Email        string `json:"email" binding:"required,email,max=254"`
	Password     string `json:"password" binding:"required,min=6,max=72"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email,max=254"`
	Password string `json:"password" binding:"required"`
}

type UpdateAccountRequest struct {
	Name            string `json:"name" binding:"required,max=120"`
	Email           string `json:"email" binding:"required,email,max=254"`
	BusinessName    string `json:"business_name" binding:"omitempty,max=150"`
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password" binding:"omitempty,min=6,max=72"`
}

// Register creates a new tenant and user
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	// Check if email already exists (including soft-deleted users)
	var existingUser models.User
	if err := database.DB.Unscoped().Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Unable to register with this email")
		return
	}

	// Check if business email already exists
	var existingTenant models.Tenant
	if err := database.DB.Unscoped().Where("email = ?", req.Email).First(&existingTenant).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Unable to register with this email")
		return
	}

	// Start transaction
	tx := database.DB.Begin()
	defer tx.Rollback()

	// Create tenant
	tenant := models.Tenant{
		BusinessName: req.BusinessName,
		Email:        req.Email,
	}

	if err := tx.Create(&tenant).Error; err != nil {
		tx.Rollback()
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create tenant")
		return
	}

	// Create user
	user := models.User{
		TenantID: tenant.ID,
		Name:     req.Name,
		Email:    req.Email,
		Role:     "admin",
	}

	if err := user.HashPassword(req.Password); err != nil {
		tx.Rollback()
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to complete registration")
		return
	}

	go utils.SendWelcomeEmail(user.Email, user.Name, tenant.BusinessName)

	// Generate JWT token
	token, err := generateToken(user.ID, user.TenantID, 0, user.Email, "admin")
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Registration successful", gin.H{
		"token": token,
		"user": gin.H{
			"id":            user.ID,
			"name":          user.Name,
			"email":         user.Email,
			"role":          user.Role,
			"customer_id":   user.CustomerID,
			"business_name": tenant.BusinessName,
		},
	})
}

// Login authenticates a user
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	// Find user by email
	var user models.User
	if err := database.DB.Preload("Tenant").Where("email = ?", req.Email).First(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Check password
	if !user.CheckPassword(req.Password) {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Check if user is active
	if !user.IsActive {
		utils.ErrorResponse(c, http.StatusForbidden, "Account is inactive. Please contact your administrator.")
		return
	}

	// Build customer ID for token
	var customerIDVal uint
	if user.CustomerID != nil {
		customerIDVal = *user.CustomerID
	}

	// Generate JWT token
	token, err := generateToken(user.ID, user.TenantID, customerIDVal, user.Email, user.Role)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Login successful", gin.H{
		"token": token,
		"user": gin.H{
			"id":            user.ID,
			"name":          user.Name,
			"email":         user.Email,
			"role":          user.Role,
			"customer_id":   user.CustomerID,
			"business_name": user.Tenant.BusinessName,
		},
	})
}

// generateToken creates a JWT token
func generateToken(userID, tenantID, customerID uint, email, role string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", fmt.Errorf("JWT_SECRET is not configured")
	}

	claims := middleware.Claims{
		UserID:     userID,
		TenantID:   tenantID,
		CustomerID: customerID,
		Email:      email,
		Role:       role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// GetMe returns the current authenticated user
func GetMe(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user models.User
	if err := database.DB.Preload("Tenant").First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User retrieved", gin.H{
		"id":            user.ID,
		"name":          user.Name,
		"email":         user.Email,
		"role":          user.Role,
		"customer_id":   user.CustomerID,
		"business_name": user.Tenant.BusinessName,
		"tenant_id":     user.TenantID,
	})
}

// UpdateMe updates the current authenticated user's account settings.
func UpdateMe(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req UpdateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.BusinessName = strings.TrimSpace(req.BusinessName)
	if req.Name == "" || req.Email == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Name and email are required")
		return
	}

	var user models.User
	if err := database.DB.Preload("Tenant").First(&user, userID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	var existingUser models.User
	if err := database.DB.Where("email = ? AND id <> ?", req.Email, user.ID).First(&existingUser).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Email already registered")
		return
	}

	if user.Role != "admin" && req.BusinessName != "" {
		utils.ErrorResponse(c, http.StatusForbidden, "Only admin users can update the business name")
		return
	}

	if user.Role == "admin" && req.BusinessName == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Business name is required")
		return
	}

	if req.NewPassword != "" {
		if req.CurrentPassword == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Current password is required to change password")
			return
		}
		if !user.CheckPassword(req.CurrentPassword) {
			utils.ErrorResponse(c, http.StatusBadRequest, "Current password does not match our records")
			return
		}
		if err := user.HashPassword(req.NewPassword); err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to hash password")
			return
		}
	}

	tx := database.DB.Begin()
	if tx.Error != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to start account update")
		return
	}

	user.Name = req.Name
	user.Email = req.Email
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update account")
		return
	}

	if user.Role == "admin" {
		if err := tx.Model(&models.Tenant{}).Where("id = ?", user.TenantID).Update("business_name", req.BusinessName).Error; err != nil {
			tx.Rollback()
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update business")
			return
		}
		user.Tenant.BusinessName = req.BusinessName
	}

	if err := tx.Commit().Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to complete account update")
		return
	}

	customerIDVal := uint(0)
	if user.CustomerID != nil {
		customerIDVal = *user.CustomerID
	}
	token, err := generateToken(user.ID, user.TenantID, customerIDVal, user.Email, user.Role)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to refresh token")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Account updated", gin.H{
		"token": token,
		"user": gin.H{
			"id":            user.ID,
			"name":          user.Name,
			"email":         user.Email,
			"role":          user.Role,
			"customer_id":   user.CustomerID,
			"business_name": user.Tenant.BusinessName,
			"tenant_id":     user.TenantID,
		},
	})
}
