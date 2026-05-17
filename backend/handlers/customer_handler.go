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

type CustomerRequest struct {
	Name    string `json:"name" binding:"required,max=120"`
	Email   string `json:"email" binding:"omitempty,email,max=254"`
	Phone   string `json:"phone" binding:"max=32"`
	Address string `json:"address" binding:"max=500"`
}

// ListCustomers returns all customers for the tenant
func ListCustomers(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	var customers []models.Customer
	if err := database.DB.Where("tenant_id = ?", tenantID).Find(&customers).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch customers")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Customers retrieved", customers)
}

// CreateCustomer creates a new customer and a linked portal user account
func CreateCustomer(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	var req CustomerRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	customer := models.Customer{
		TenantID: tenantID,
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		Address:  req.Address,
	}

	if err := database.DB.Create(&customer).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create customer")
		return
	}

	// Auto-create a portal user account for this customer
	portalEmail := req.Email
	if portalEmail == "" {
		// Fallback email if customer has none
		portalEmail = fmt.Sprintf("customer%d@portal.invoiceflow.local", customer.ID)
	}

	// Check if a user with this email already exists; if so, skip creation quietly
	var existingUser models.User
	if err := database.DB.Where("email = ?", portalEmail).First(&existingUser).Error; err != nil {
		// No existing user – create one
		portalPassword, err := utils.GenerateRandomPassword(10)
		if err != nil {
			utils.SuccessResponse(c, http.StatusCreated, "Customer created (portal account failed)", gin.H{
				"customer": customer,
			})
			return
		}
		portalUser := models.User{
			TenantID:   tenantID,
			CustomerID: &customer.ID,
			Name:       req.Name,
			Email:      portalEmail,
			Role:       "customer",
		}

		if hashErr := portalUser.HashPassword(portalPassword); hashErr != nil {
			// Non-fatal: customer is created, just log
			utils.SuccessResponse(c, http.StatusCreated, "Customer created (portal account failed)", gin.H{
				"customer": customer,
			})
			return
		}

		if createErr := database.DB.Create(&portalUser).Error; createErr != nil {
			utils.SuccessResponse(c, http.StatusCreated, "Customer created (portal account failed)", gin.H{
				"customer": customer,
			})
			return
		}

		go utils.SendCustomerPortalEmail(portalEmail, req.Name, portalEmail, portalPassword)

		utils.SuccessResponse(c, http.StatusCreated, "Customer created", gin.H{
			"customer":          customer,
			"portal_email":      portalEmail,
			"portal_password":   portalPassword,
			"portal_login_note": "Share these credentials with the customer to access their portal.",
		})
		return
	}

	// User already existed (e.g., customer email re-used)
	utils.SuccessResponse(c, http.StatusCreated, "Customer created", gin.H{
		"customer": customer,
	})
}

// GetCustomer returns a single customer
func GetCustomer(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")

	var customer models.Customer
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&customer).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Customer not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Customer retrieved", customer)
}

// UpdateCustomer updates a customer
func UpdateCustomer(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")
	var req CustomerRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var customer models.Customer
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&customer).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Customer not found")
		return
	}

	customer.Name = req.Name
	customer.Email = req.Email
	customer.Phone = req.Phone
	customer.Address = req.Address

	if err := database.DB.Save(&customer).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update customer")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Customer updated", customer)
}

// DeleteCustomer deletes a customer
func DeleteCustomer(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")

	var customer models.Customer
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&customer).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Customer not found")
		return
	}

	if err := database.DB.Delete(&customer).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete customer")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Customer deleted", nil)
}
