package handlers

import (
	"net/http"

	"invoiceflow/database"
	"invoiceflow/middleware"
	"invoiceflow/models"
	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
)

type CustomerRequest struct {
	Name    string `json:"name" binding:"required"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
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

// CreateCustomer creates a new customer
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

	utils.SuccessResponse(c, http.StatusCreated, "Customer created", customer)
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
