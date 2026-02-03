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

type TransactionRequest struct {
	CustomerID uint      `json:"customer_id" binding:"required"`
	ItemID     uint      `json:"item_id" binding:"required"`
	Quantity   int       `json:"quantity" binding:"required,gt=0"`
	Date       time.Time `json:"date" binding:"required"`
	Notes      string    `json:"notes"`
}

// ListTransactions returns all transactions for the tenant
func ListTransactions(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	customerID := c.Query("customer_id")

	query := database.DB.Where("tenant_id = ?", tenantID).
		Preload("Customer").
		Preload("Item")

	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}

	var transactions []models.Transaction
	if err := query.Order("date DESC").Find(&transactions).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch transactions")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Transactions retrieved", transactions)
}

// CreateTransaction creates a new transaction
func CreateTransaction(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	var req TransactionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	// Verify customer belongs to tenant
	var customer models.Customer
	if err := database.DB.Where("id = ? AND tenant_id = ?", req.CustomerID, tenantID).First(&customer).Error; err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid customer")
		return
	}

	// Verify item belongs to tenant and get unit price
	var item models.Item
	if err := database.DB.Where("id = ? AND tenant_id = ?", req.ItemID, tenantID).First(&item).Error; err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid item")
		return
	}

	transaction := models.Transaction{
		TenantID:   tenantID,
		CustomerID: req.CustomerID,
		ItemID:     req.ItemID,
		Quantity:   req.Quantity,
		UnitPrice:  item.UnitPrice,
		Date:       req.Date,
		Notes:      req.Notes,
	}

	if err := database.DB.Create(&transaction).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create transaction")
		return
	}

	// Load relationships
	database.DB.Preload("Customer").Preload("Item").First(&transaction, transaction.ID)

	utils.SuccessResponse(c, http.StatusCreated, "Transaction created", transaction)
}

// GetTransaction returns a single transaction
func GetTransaction(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")

	var transaction models.Transaction
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).
		Preload("Customer").
		Preload("Item").
		First(&transaction).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Transaction not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Transaction retrieved", transaction)
}

// DeleteTransaction deletes a transaction
func DeleteTransaction(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")

	var transaction models.Transaction
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&transaction).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Transaction not found")
		return
	}

	if err := database.DB.Delete(&transaction).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete transaction")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Transaction deleted", nil)
}
