package handlers

import (
	"fmt"
	"net/http"
	"time"

	"invoiceflow/database"
	"invoiceflow/middleware"
	"invoiceflow/models"
	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
)

type GenerateInvoiceRequest struct {
	CustomerID uint `json:"customer_id" binding:"required"`
	Month      int  `json:"month" binding:"required,min=1,max=12"`
	Year       int  `json:"year" binding:"required"`
}

type DashboardStats struct {
	TotalRevenue     float64 `json:"total_revenue"`
	PendingInvoices  int64   `json:"pending_invoices"`
	TransactionCount int64   `json:"transaction_count"`
	CustomerCount    int64   `json:"customer_count"`
}

// ListInvoices returns all invoices for the tenant
func ListInvoices(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	var invoices []models.Invoice
	if err := database.DB.Where("tenant_id = ?", tenantID).
		Preload("Customer").
		Order("generated_at DESC").
		Find(&invoices).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch invoices")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Invoices retrieved", invoices)
}

// GetInvoice returns a single invoice with line items
func GetInvoice(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")

	var invoice models.Invoice
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).
		Preload("Customer").
		Preload("LineItems").
		First(&invoice).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Invoice not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Invoice retrieved", invoice)
}

// GenerateInvoice creates a monthly invoice from transactions
func GenerateInvoice(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	var req GenerateInvoiceRequest

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

	// Check if invoice already exists for this month/year/customer
	var existingInvoice models.Invoice
	if err := database.DB.Where("tenant_id = ? AND customer_id = ? AND month = ? AND year = ?",
		tenantID, req.CustomerID, req.Month, req.Year).First(&existingInvoice).Error; err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Invoice already exists for this period")
		return
	}

	// Get date range for the month
	startDate := time.Date(req.Year, time.Month(req.Month), 1, 0, 0, 0, 0, time.Local)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

	// Fetch transactions for this customer/month
	var transactions []models.Transaction
	if err := database.DB.Where("tenant_id = ? AND customer_id = ? AND date >= ? AND date <= ?",
		tenantID, req.CustomerID, startDate, endDate).
		Preload("Item").
		Find(&transactions).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch transactions")
		return
	}

	if len(transactions) == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "No transactions found for this period")
		return
	}

	// Aggregate transactions by item and price
	type itemPriceKey struct {
		ItemID    uint
		UnitPrice float64
	}
	itemTotals := make(map[itemPriceKey]*models.InvoiceItem)
	var total float64

	for _, t := range transactions {
		key := itemPriceKey{ItemID: t.ItemID, UnitPrice: t.UnitPrice}
		if existing, ok := itemTotals[key]; ok {
			existing.Quantity += t.Quantity
			existing.Total = float64(existing.Quantity) * existing.UnitPrice
		} else {
			itemTotals[key] = &models.InvoiceItem{
				ItemName:    t.Item.Name,
				Description: t.Item.Description,
				Quantity:    t.Quantity,
				UnitPrice:   t.UnitPrice,
				Total:       float64(t.Quantity) * t.UnitPrice,
			}
		}
		total += float64(t.Quantity) * t.UnitPrice
	}

	// Create invoice
	invoice := models.Invoice{
		TenantID:      tenantID,
		CustomerID:    req.CustomerID,
		InvoiceNumber: generateInvoiceNumber(tenantID, req.Year, req.Month),
		Month:         req.Month,
		Year:          req.Year,
		Total:         total,
		Status:        "draft",
		GeneratedAt:   time.Now(),
	}

	if err := database.DB.Create(&invoice).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create invoice")
		return
	}

	// Create line items
	var lineItems []models.InvoiceItem
	for _, item := range itemTotals {
		item.InvoiceID = invoice.ID
		lineItems = append(lineItems, *item)
	}

	if err := database.DB.Create(&lineItems).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create invoice items")
		return
	}

	// Load relationships
	database.DB.Preload("Customer").Preload("LineItems").First(&invoice, invoice.ID)

	utils.SuccessResponse(c, http.StatusCreated, "Invoice generated successfully", invoice)
}

// UpdateInvoiceStatus updates invoice status
func UpdateInvoiceStatus(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")

	var req struct {
		Status string `json:"status" binding:"required,oneof=draft sent paid"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var invoice models.Invoice
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&invoice).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Invoice not found")
		return
	}

	invoice.Status = req.Status
	if err := database.DB.Save(&invoice).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update invoice")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Invoice status updated", invoice)
}

// DeleteInvoice deletes an invoice and its line items
func DeleteInvoice(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")

	// Start a transaction to delete both invoice and its items
	tx := database.DB.Begin()
	if tx.Error != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to start transaction")
		return
	}

	// Check if invoice exists and belongs to tenant
	var invoice models.Invoice
	if err := tx.Where("id = ? AND tenant_id = ?", id, tenantID).First(&invoice).Error; err != nil {
		tx.Rollback()
		utils.ErrorResponse(c, http.StatusNotFound, "Invoice not found")
		return
	}

	// Delete line items first
	if err := tx.Where("invoice_id = ?", id).Delete(&models.InvoiceItem{}).Error; err != nil {
		tx.Rollback()
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete invoice items")
		return
	}

	// Delete the invoice (soft delete if gorm.DeletedAt is present, but let's do hard delete for tests if preferred or follow model)
	// The model has DeletedAt gorm.DeletedAt so it's a soft delete
	if err := tx.Delete(&invoice).Error; err != nil {
		tx.Rollback()
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete invoice")
		return
	}

	if err := tx.Commit().Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to commit transaction")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Invoice deleted successfully", nil)
}

// GetDashboardStats returns dashboard statistics
func GetDashboardStats(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)

	var stats DashboardStats

	// Total revenue (paid invoices)
	database.DB.Model(&models.Invoice{}).
		Where("tenant_id = ? AND status = ?", tenantID, "paid").
		Select("COALESCE(SUM(total), 0)").
		Scan(&stats.TotalRevenue)

	// Pending invoices
	database.DB.Model(&models.Invoice{}).
		Where("tenant_id = ? AND status IN ?", tenantID, []string{"draft", "sent"}).
		Count(&stats.PendingInvoices)

	// Transaction count
	database.DB.Model(&models.Transaction{}).
		Where("tenant_id = ?", tenantID).
		Count(&stats.TransactionCount)

	// Customer count
	database.DB.Model(&models.Customer{}).
		Where("tenant_id = ?", tenantID).
		Count(&stats.CustomerCount)

	utils.SuccessResponse(c, http.StatusOK, "Dashboard stats retrieved", stats)
}

// generateInvoiceNumber creates a unique invoice number
func generateInvoiceNumber(tenantID uint, year, month int) string {
	return fmt.Sprintf("INV-%d-%04d%02d-%d", tenantID, year, month, time.Now().Unix()%10000)
}
