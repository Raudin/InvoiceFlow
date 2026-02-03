package handlers

import (
	"net/http"
	"os"
	"time"

	"invoiceflow/database"
	"invoiceflow/models"
	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type RegisterRequest struct {
	BusinessName string `json:"business_name" binding:"required"`
	Name         string `json:"name" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Password     string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type Claims struct {
	UserID   uint   `json:"user_id"`
	TenantID uint   `json:"tenant_id"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

// Register creates a new tenant and user
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	// Check if email already exists
	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Email already registered")
		return
	}

	// Create tenant
	tenant := models.Tenant{
		BusinessName: req.BusinessName,
		Email:        req.Email,
	}

	if err := database.DB.Create(&tenant).Error; err != nil {
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
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	if err := database.DB.Create(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Generate JWT token
	token, err := generateToken(user.ID, user.TenantID, user.Email)
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

	// Generate JWT token
	token, err := generateToken(user.ID, user.TenantID, user.Email)
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
			"business_name": user.Tenant.BusinessName,
		},
	})
}

// generateToken creates a JWT token
func generateToken(userID, tenantID uint, email string) (string, error) {
	claims := Claims{
		UserID:   userID,
		TenantID: tenantID,
		Email:    email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour * 7)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
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
		"business_name": user.Tenant.BusinessName,
		"tenant_id":     user.TenantID,
	})
}
