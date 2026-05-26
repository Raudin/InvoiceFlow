package handlers

import (
	"net/http"
	"time"

	"invoiceflow/database"
	"invoiceflow/middleware"
	"invoiceflow/models"
	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
)

// GetPortalDashboard returns stats for the authenticated customer
func GetPortalDashboard(c *gin.Context) {
	customerID, ok := middleware.GetCustomerID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusForbidden, "No customer account associated with this user")
		return
	}

	var transactionCount int64
	database.DB.Model(&models.Transaction{}).
		Where("customer_id = ?", customerID).
		Count(&transactionCount)

	var totalInvoices int64
	database.DB.Model(&models.Invoice{}).
		Where("customer_id = ?", customerID).
		Count(&totalInvoices)

	var pendingInvoices int64
	database.DB.Model(&models.Invoice{}).
		Where("customer_id = ? AND status IN ?", customerID, []string{"draft", "sent"}).
		Count(&pendingInvoices)

	var approvedInvoices int64
	database.DB.Model(&models.Invoice{}).
		Where("customer_id = ? AND status = ?", customerID, "approved").
		Count(&approvedInvoices)

	var totalSpend float64
	database.DB.Model(&models.Invoice{}).
		Where("customer_id = ?", customerID).
		Select("COALESCE(SUM(total), 0)").
		Scan(&totalSpend)

	// Recent transactions (last 5)
	var recentTransactions []models.Transaction
	database.DB.Where("customer_id = ?", customerID).
		Preload("Item").
		Order("date DESC").
		Limit(5).
		Find(&recentTransactions)

	utils.SuccessResponse(c, http.StatusOK, "Portal dashboard retrieved", gin.H{
		"transaction_count":   transactionCount,
		"total_invoices":      totalInvoices,
		"pending_invoices":    pendingInvoices,
		"approved_invoices":   approvedInvoices,
		"total_spend":         totalSpend,
		"recent_transactions": recentTransactions,
	})
}

// ListPortalTransactions returns the authenticated customer's transactions
func ListPortalTransactions(c *gin.Context) {
	customerID, ok := middleware.GetCustomerID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusForbidden, "No customer account associated with this user")
		return
	}

	var transactions []models.Transaction
	if err := database.DB.Where("customer_id = ?", customerID).
		Preload("Item").
		Order("date DESC").
		Find(&transactions).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch transactions")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Transactions retrieved", transactions)
}

// ListPortalInvoices returns the authenticated customer's invoices
func ListPortalInvoices(c *gin.Context) {
	customerID, ok := middleware.GetCustomerID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusForbidden, "No customer account associated with this user")
		return
	}

	var invoices []models.Invoice
	if err := database.DB.Where("customer_id = ?", customerID).
		Preload("LineItems").
		Order("generated_at DESC").
		Find(&invoices).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch invoices")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Invoices retrieved", invoices)
}

// ApprovePortalInvoice lets a customer approve one of their invoices
func ApprovePortalInvoice(c *gin.Context) {
	customerID, ok := middleware.GetCustomerID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusForbidden, "No customer account associated with this user")
		return
	}
	id := c.Param("id")

	var invoice models.Invoice
	if err := database.DB.Where("id = ? AND customer_id = ?", id, customerID).First(&invoice).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Invoice not found")
		return
	}

	if invoice.Status == "approved" {
		utils.ErrorResponse(c, http.StatusConflict, "Invoice is already approved")
		return
	}

	if invoice.Status == "paid" {
		utils.ErrorResponse(c, http.StatusConflict, "Cannot approve a paid invoice")
		return
	}

	now := time.Now()
	invoice.Status = "approved"
	invoice.ApprovedAt = &now

	if err := database.DB.Save(&invoice).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to approve invoice")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Invoice approved successfully", invoice)
}
