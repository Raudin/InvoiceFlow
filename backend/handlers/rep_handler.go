package handlers

import (
	"fmt"
	"net/http"

	"invoiceflow/database"
	"invoiceflow/middleware"
	"invoiceflow/models"
	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
)

type RepRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password"` // Optional on update
}

type ToggleActiveRequest struct {
	IsActive bool `json:"is_active"`
}

// ListReps returns all representatives for the tenant
func ListReps(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	var reps []models.User
	if err := database.DB.Where("tenant_id = ? AND role = ?", tenantID, "rep").Find(&reps).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch representatives")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Representatives retrieved", reps)
}

// CreateRep creates a new representative account
func CreateRep(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	var req RepRequest

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

	password := req.Password
	if password == "" {
		var err error
		password, err = utils.GenerateRandomPassword(10)
		if err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate password")
			return
		}
	}

	rep := models.User{
		TenantID: tenantID,
		Name:     req.Name,
		Email:    req.Email,
		Role:     "rep",
		IsActive: true,
	}

	if err := rep.HashPassword(password); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	if err := database.DB.Create(&rep).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create representative")
		return
	}

	go utils.SendRepWelcomeEmail(rep.Email, rep.Name, rep.Email, password)

	utils.SuccessResponse(c, http.StatusCreated, "Representative created successfully", rep)
}

// UpdateRep updates a representative's information
func UpdateRep(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")
	var req RepRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var rep models.User
	if err := database.DB.Where("id = ? AND tenant_id = ? AND role = ?", id, tenantID, "rep").First(&rep).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Representative not found")
		return
	}

	rep.Name = req.Name
	rep.Email = req.Email

	if req.Password != "" {
		if err := rep.HashPassword(req.Password); err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to hash password")
			return
		}
	}

	if err := database.DB.Save(&rep).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update representative")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Representative updated successfully", rep)
}

// ToggleRepStatus activates or deactivates a representative
func ToggleRepStatus(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")
	var req ToggleActiveRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var rep models.User
	if err := database.DB.Where("id = ? AND tenant_id = ? AND role = ?", id, tenantID, "rep").First(&rep).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Representative not found")
		return
	}

	rep.IsActive = req.IsActive
	if err := database.DB.Save(&rep).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update status")
		return
	}

	status := "activated"
	if !rep.IsActive {
		status = "deactivated"
	}

	utils.SuccessResponse(c, http.StatusOK, fmt.Sprintf("Representative %s successfully", status), rep)
}

// DeleteRep deletes a representative account
func DeleteRep(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")

	var rep models.User
	if err := database.DB.Where("id = ? AND tenant_id = ? AND role = ?", id, tenantID, "rep").First(&rep).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Representative not found")
		return
	}

	if err := database.DB.Delete(&rep).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete representative")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Representative deleted successfully", nil)
}
