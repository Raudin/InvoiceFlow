package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"invoiceflow/database"
	"invoiceflow/handlers"
	"invoiceflow/models"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupTransactionTestDB(t *testing.T) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open in-memory db: %v", err)
	}
	if err := db.AutoMigrate(&models.Tenant{}, &models.User{}, &models.Customer{}, &models.Item{}, &models.Transaction{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	database.DB = db
}

func TestCreateTransaction(t *testing.T) {
	setupTransactionTestDB(t)
	gin.SetMode(gin.TestMode)

	// Seed data
	tenant := models.Tenant{BusinessName: "Test Tenant", Email: "test@example.com"}
	database.DB.Create(&tenant)

	customer := models.Customer{TenantID: tenant.ID, Name: "Test Customer"}
	database.DB.Create(&customer)

	item1 := models.Item{TenantID: tenant.ID, Name: "Item 1", UnitPrice: 10.0}
	item2 := models.Item{TenantID: tenant.ID, Name: "Item 2", UnitPrice: 20.0}
	database.DB.Create(&item1)
	database.DB.Create(&item2)

	r := gin.New()
	r.POST("/transactions", func(c *gin.Context) {
		c.Set("tenant_id", tenant.ID)
		c.Set("user_id", uint(1))
		handlers.CreateTransaction(c)
	})

	t.Run("Success Batch Creation", func(t *testing.T) {
		reqBody := handlers.BatchTransactionRequest{
			CustomerID: customer.ID,
			Date:       time.Now(),
			Items: []handlers.TransactionItem{
				{ItemID: item1.ID, Quantity: 2},
				{ItemID: item2.ID, Quantity: 1},
			},
		}
		body, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest(http.MethodPost, "/transactions", bytes.NewBuffer(body))
		resp := httptest.NewRecorder()
		r.ServeHTTP(resp, req)

		if resp.Code != http.StatusCreated {
			t.Errorf("status = %d, want %d", resp.Code, http.StatusCreated)
		}

		var count int64
		database.DB.Model(&models.Transaction{}).Count(&count)
		if count != 2 {
			t.Errorf("transaction count = %d, want 2", count)
		}
	})

	t.Run("Invalid Item ID Returns 400 and Rolls Back", func(t *testing.T) {
		// Reset count
		database.DB.Exec("DELETE FROM transactions")

		reqBody := handlers.BatchTransactionRequest{
			CustomerID: customer.ID,
			Date:       time.Now(),
			Items: []handlers.TransactionItem{
				{ItemID: item1.ID, Quantity: 2},
				{ItemID: 999, Quantity: 1}, // Invalid ID
			},
		}
		body, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest(http.MethodPost, "/transactions", bytes.NewBuffer(body))
		resp := httptest.NewRecorder()
		r.ServeHTTP(resp, req)

		if resp.Code != http.StatusBadRequest {
			t.Errorf("status = %d, want %d", resp.Code, http.StatusBadRequest)
		}

		var count int64
		database.DB.Model(&models.Transaction{}).Count(&count)
		if count != 0 {
			t.Errorf("transaction count = %d, want 0 after rollback", count)
		}
	})

	t.Run("Empty Items List Rejected", func(t *testing.T) {
		reqBody := handlers.BatchTransactionRequest{
			CustomerID: customer.ID,
			Date:       time.Now(),
			Items:      []handlers.TransactionItem{},
		}
		body, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest(http.MethodPost, "/transactions", bytes.NewBuffer(body))
		resp := httptest.NewRecorder()
		r.ServeHTTP(resp, req)

		if resp.Code != http.StatusBadRequest {
			t.Errorf("status = %d, want %d", resp.Code, http.StatusBadRequest)
		}
	})

	t.Run("Duplicate Item IDs Handled Correctly", func(t *testing.T) {
		database.DB.Exec("DELETE FROM transactions")

		reqBody := handlers.BatchTransactionRequest{
			CustomerID: customer.ID,
			Date:       time.Now(),
			Items: []handlers.TransactionItem{
				{ItemID: item1.ID, Quantity: 2},
				{ItemID: item1.ID, Quantity: 3}, // Duplicate item ID
			},
		}
		body, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest(http.MethodPost, "/transactions", bytes.NewBuffer(body))
		resp := httptest.NewRecorder()
		r.ServeHTTP(resp, req)

		if resp.Code != http.StatusCreated {
			t.Errorf("status = %d, want %d", resp.Code, http.StatusCreated)
		}

		var count int64
		database.DB.Model(&models.Transaction{}).Count(&count)
		if count != 2 {
			t.Errorf("transaction count = %d, want 2", count)
		}
	})
}
