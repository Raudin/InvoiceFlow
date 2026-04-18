package handlers

import (
	"net/http"

	"invoiceflow/database"
	"invoiceflow/middleware"
	"invoiceflow/models"
	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
)

type ItemRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	UnitPrice   float64 `json:"unit_price" binding:"required,gt=0"`
}

// ListItems returns all items for the tenant
func ListItems(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	role := middleware.GetRole(c)

	var items []models.Item
	if err := database.DB.Where("tenant_id = ?", tenantID).Find(&items).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch items")
		return
	}

	// If the user is a rep, hide the unit price
	if role == "rep" {
		for i := range items {
			items[i].UnitPrice = 0
		}
	}

	utils.SuccessResponse(c, http.StatusOK, "Items retrieved", items)
}

// CreateItem creates a new item
func CreateItem(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	var req ItemRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	item := models.Item{
		TenantID:    tenantID,
		Name:        req.Name,
		Description: req.Description,
		UnitPrice:   req.UnitPrice,
	}

	if err := database.DB.Create(&item).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create item")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Item created", item)
}

// GetItem returns a single item
func GetItem(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")

	var item models.Item
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&item).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Item not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Item retrieved", item)
}

// UpdateItem updates an item
func UpdateItem(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")
	var req ItemRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	var item models.Item
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&item).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Item not found")
		return
	}

	item.Name = req.Name
	item.Description = req.Description
	item.UnitPrice = req.UnitPrice

	if err := database.DB.Save(&item).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update item")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Item updated", item)
}

// DeleteItem deletes an item
func DeleteItem(c *gin.Context) {
	tenantID := middleware.GetTenantID(c)
	id := c.Param("id")

	var item models.Item
	if err := database.DB.Where("id = ? AND tenant_id = ?", id, tenantID).First(&item).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Item not found")
		return
	}

	if err := database.DB.Delete(&item).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete item")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Item deleted", nil)
}
