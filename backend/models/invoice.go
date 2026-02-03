package models

import (
	"time"

	"gorm.io/gorm"
)

type Invoice struct {
	ID            uint           `gorm:"primarykey" json:"id"`
	TenantID      uint           `gorm:"not null;index" json:"tenant_id"`
	CustomerID    uint           `gorm:"not null;index" json:"customer_id"`
	InvoiceNumber string         `gorm:"uniqueIndex;size:255;not null" json:"invoice_number"`
	Month         int            `gorm:"not null" json:"month"`
	Year          int            `gorm:"not null" json:"year"`
	Total         float64        `gorm:"not null" json:"total"`
	Status        string         `gorm:"default:'draft'" json:"status"` // draft, sent, paid
	GeneratedAt   time.Time      `gorm:"not null" json:"generated_at"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Tenant    Tenant        `gorm:"foreignKey:TenantID" json:"-"`
	Customer  Customer      `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	LineItems []InvoiceItem `gorm:"foreignKey:InvoiceID" json:"line_items,omitempty"`
}

type InvoiceItem struct {
	ID          uint      `gorm:"primarykey" json:"id"`
	InvoiceID   uint      `gorm:"not null;index" json:"invoice_id"`
	ItemName    string    `gorm:"not null" json:"item_name"`
	Description string    `json:"description"`
	Quantity    int       `gorm:"not null" json:"quantity"`
	UnitPrice   float64   `gorm:"not null" json:"unit_price"`
	Total       float64   `gorm:"not null" json:"total"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationship
	Invoice Invoice `gorm:"foreignKey:InvoiceID" json:"-"`
}
