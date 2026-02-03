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
	UserID   uint   `json:"user_id"`
	TenantID uint   `json:"tenant_id"`
	Email    string `json:"email"`
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
		c.Set("email", claims.Email)

		c.Next()
	}
}

// GetTenantID retrieves tenant ID from context
func GetTenantID(c *gin.Context) uint {
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		return 0
	}
	return tenantID.(uint)
}

// GetUserID retrieves user ID from context
func GetUserID(c *gin.Context) uint {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0
	}
	return userID.(uint)
}
