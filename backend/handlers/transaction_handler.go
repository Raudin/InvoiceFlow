package handlers

import (
	"net/http"
	"strconv"
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
	role := middleware.GetRole(c)
	userID := middleware.GetUserID(c)

	query := database.DB.Where("tenant_id = ?", tenantID).
		Preload("Customer").
		Preload("Item").
		Preload("RecordedBy")

	// If the user is a rep, only show their transactions
	if role == "rep" {
		query = query.Where("recorded_by_id = ?", userID)
	}

	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}

	month := c.Query("month")
	year := c.Query("year")

	if month != "" && year != "" {
		m, err := strconv.Atoi(month)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid month parameter")
			return
		}
		y, err := strconv.Atoi(year)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid year parameter")
			return
		}

		// Use local time if the DB is stored in local, or just be explicit with the range
		start := time.Date(y, time.Month(m), 1, 0, 0, 0, 0, time.Local)
		end := start.AddDate(0, 1, 0).Add(-time.Second)

		query = query.Where("date >= ? AND date <= ?", start, end)
	}

	var transactions []models.Transaction
	if err := query.Order("date DESC").Find(&transactions).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch transactions")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Transactions retrieved", transactions)
}

// BatchTransactionRequest defines the payload for creating multiple transactions
type BatchTransactionRequest struct {
	CustomerID uint              `json:"customer_id" binding:"required"`
	Date       time.Time         `json:"date" binding:"required"`
	Items      []TransactionItem `json:"items" binding:"required,dive"`
	Notes      string            `json:"notes"`
}

type TransactionItem struct {
	ItemID   uint `json:"item_id" binding:"required"`
	Quantity int  `json:"quantity" binding:"required,gt=0"`
}

// CreateTransaction creates multiple transactions for a customer on a specific date.
// BOLT OPTIMIZATION: Refactored to use batch operations to avoid N+1 queries.
// Previously, it fetched each item and created each transaction in a loop (2N + 1 queries).
// Now, it fetches all items in one query and performs a batch insert (3 queries total).
func CreateTransaction(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	userID := middleware.GetUserID(c)
	var req BatchTransactionRequest

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

	// 1. Collect all unique ItemIDs from the request
	itemIDsMap := make(map[uint]bool)
	var itemIDs []uint
	for _, reqItem := range req.Items {
		if !itemIDsMap[reqItem.ItemID] {
			itemIDsMap[reqItem.ItemID] = true
			itemIDs = append(itemIDs, reqItem.ItemID)
		}
	}

	// Start a DB transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 2. Fetch all required items in a single query
	var items []models.Item
	if err := tx.Where("id IN ? AND tenant_id = ?", itemIDs, tenantID).Find(&items).Error; err != nil {
		tx.Rollback()
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch items")
		return
	}

	// Verify all items were found
	if len(items) != len(itemIDs) {
		tx.Rollback()
		utils.ErrorResponse(c, http.StatusBadRequest, "One or more invalid item IDs")
		return
	}

	// Map items for quick lookup by ID
	itemsMap := make(map[uint]models.Item)
	for _, item := range items {
		itemsMap[item.ID] = item
	}

	// 3. Prepare slice for batch insert
	var transactions []models.Transaction
	for _, reqItem := range req.Items {
		item := itemsMap[reqItem.ItemID]
		transactions = append(transactions, models.Transaction{
			TenantID:     tenantID,
			CustomerID:   req.CustomerID,
			ItemID:       reqItem.ItemID,
			RecordedByID: userID,
			Quantity:     reqItem.Quantity,
			UnitPrice:    item.UnitPrice,
			Date:         req.Date,
			Notes:        req.Notes,
		})
	}

	// 4. Perform batch insert
	if err := tx.Create(&transactions).Error; err != nil {
		tx.Rollback()
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create transactions")
		return
	}

	if err := tx.Commit().Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to commit transactions")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Transactions created successfully", transactions)
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

// UpdateTransaction updates a transaction
func UpdateTransaction(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	role := middleware.GetRole(c)
	userID := middleware.GetUserID(c)
	id := c.Param("id")

	var req struct {
		Quantity int    `json:"quantity" binding:"required,gt=0"`
		Notes    string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var transaction models.Transaction
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&transaction).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Transaction not found")
		return
	}

	// Restriction for reps: can only edit their own transactions within 24 hours
	if role == "rep" {
		if transaction.RecordedByID != userID {
			utils.ErrorResponse(c, http.StatusForbidden, "You can only edit your own transactions")
			return
		}
		if time.Since(transaction.CreatedAt) > 24*time.Hour {
			utils.ErrorResponse(c, http.StatusForbidden, "Transactions older than 24 hours cannot be edited")
			return
		}
	}

	transaction.Quantity = req.Quantity
	transaction.Notes = req.Notes

	if err := database.DB.Save(&transaction).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update transaction")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Transaction updated successfully", transaction)
}

// DeleteTransaction deletes a transaction
func DeleteTransaction(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	role := middleware.GetRole(c)
	userID := middleware.GetUserID(c)
	id := c.Param("id")

	var transaction models.Transaction
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&transaction).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Transaction not found")
		return
	}

	// Restriction for reps: can only delete their own transactions within 24 hours
	if role == "rep" {
		if transaction.RecordedByID != userID {
			utils.ErrorResponse(c, http.StatusForbidden, "You can only delete your own transactions")
			return
		}
		if time.Since(transaction.CreatedAt) > 24*time.Hour {
			utils.ErrorResponse(c, http.StatusForbidden, "Transactions older than 24 hours cannot be deleted")
			return
		}
	}

	if err := database.DB.Delete(&transaction).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete transaction")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Transaction deleted", nil)
}
