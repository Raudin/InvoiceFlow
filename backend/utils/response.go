package utils

import "github.com/gin-gonic/gin"

// SuccessResponse sends a success response
func SuccessResponse(c *gin.Context, code int, message string, data interface{}) {
	c.JSON(code, gin.H{
		"success": true,
		"message": message,
		"data":    data,
	})
}

// ErrorResponse sends an error response
func ErrorResponse(c *gin.Context, code int, message string) {
	c.JSON(code, gin.H{
		"success": false,
		"message": message,
		"data":    nil,
	})
}
