package models

import (
	"time"

	"gorm.io/gorm"
)

type Transaction struct {
	ID         uint           `gorm:"primarykey" json:"id"`
	TenantID   uint           `gorm:"not null;index" json:"tenant_id"`
	CustomerID uint           `gorm:"not null;index" json:"customer_id"`
	ItemID     uint           `gorm:"not null;index" json:"item_id"`
	Quantity   int            `gorm:"not null" json:"quantity"`
	UnitPrice  float64        `gorm:"not null" json:"unit_price"`
	Date       time.Time      `gorm:"not null;index" json:"date"`
	Notes      string         `json:"notes"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	
	// Relationships
	Tenant   Tenant   `gorm:"foreignKey:TenantID" json:"-"`
	Customer Customer `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Item     Item     `gorm:"foreignKey:ItemID" json:"item,omitempty"`
}

// Total calculates the transaction total
func (t *Transaction) Total() float64 {
	return float64(t.Quantity) * t.UnitPrice
}
