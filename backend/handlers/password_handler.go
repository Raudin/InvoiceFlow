package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"invoiceflow/database"
	"invoiceflow/models"
	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
)

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email,max=254"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=6,max=72"`
}

// ForgotPassword generates a reset token and "sends" it via email
func ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// We don't want to reveal if a user exists or not for security
		utils.SuccessResponse(c, http.StatusOK, "If your email is registered, you will receive a reset link.", nil)
		return
	}

	// Generate reset token
	token := make([]byte, 32)
	rand.Read(token)
	tokenString := hex.EncodeToString(token)

	user.ResetToken = tokenString
	expires := time.Now().Add(1 * time.Hour)
	user.ResetExpires = &expires

	if err := database.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save reset token")
		return
	}

	go utils.SendPasswordResetEmail(user.Email, user.Name, tokenString)

	utils.SuccessResponse(c, http.StatusOK, "If your email is registered, you will receive a reset link.", nil)
}

// ResetPassword resets the password using a valid token
func ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if err := database.DB.Where("reset_token = ? AND reset_expires > ?", req.Token, time.Now()).First(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired reset token")
		return
	}

	if err := user.HashPassword(req.Password); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user.ResetToken = ""
	user.ResetExpires = nil

	if err := database.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Password reset successful", nil)
}
