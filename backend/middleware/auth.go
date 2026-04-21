package middleware

import (
	"net/http"
	"os"
	"strings"

	"invoiceflow/database"
	"invoiceflow/models"
	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID     uint   `json:"user_id"`
	TenantID   uint   `json:"tenant_id"`
	CustomerID uint   `json:"customer_id"`
	Email      string `json:"email"`
	Role       string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware validates JWT token and extracts user info
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Authorization header required")
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid authorization header format")
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims := &Claims{}

		// Parse and validate token
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid or expired token")
			c.Abort()
			return
		}

		// Verify user exists
		var user models.User
		if err := database.DB.First(&user, claims.UserID).Error; err != nil {
			utils.ErrorResponse(c, http.StatusUnauthorized, "User not found")
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("user_id", claims.UserID)
		c.Set("tenant_id", claims.TenantID)
		c.Set("customer_id", claims.CustomerID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// RepRequired blocks non-rep users
func RepRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "rep" {
			utils.ErrorResponse(c, http.StatusForbidden, "Representative access required")
			c.Abort()
			return
		}
		c.Next()
	}
}

// AdminOrRepRequired blocks users who are neither admin nor rep
func AdminOrRepRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "admin" && role != "rep" {
			utils.ErrorResponse(c, http.StatusForbidden, "Admin or Representative access required")
			c.Abort()
			return
		}
		c.Next()
	}
}

// AdminRequired blocks non-admin users
func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "admin" {
			utils.ErrorResponse(c, http.StatusForbidden, "Admin access required")
			c.Abort()
			return
		}
		c.Next()
	}
}

// CustomerRequired blocks non-customer users
func CustomerRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get("role")
		if role != "customer" {
			utils.ErrorResponse(c, http.StatusForbidden, "Customer access required")
			c.Abort()
			return
		}
		c.Next()
	}
}

// GetTenantID retrieves tenant ID from context
func GetTenantID(c *gin.Context) uint {
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		return 0
	}
	if val, ok := tenantID.(uint); ok {
		return val
	}
	return 0
}

// GetUserID retrieves user ID from context
func GetUserID(c *gin.Context) uint {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0
	}
	if val, ok := userID.(uint); ok {
		return val
	}
	return 0
}

// GetRole retrieves the role from context
func GetRole(c *gin.Context) string {
	role, exists := c.Get("role")
	if !exists {
		return ""
	}
	if val, ok := role.(string); ok {
		return val
	}
	return ""
}

// GetCustomerID retrieves the customer ID from context (only for customer-role users)
func GetCustomerID(c *gin.Context) uint {
	customerID, exists := c.Get("customer_id")
	if !exists {
		return 0
	}
	if val, ok := customerID.(uint); ok {
		return val
	}
	return 0
}
