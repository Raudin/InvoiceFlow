package models

import (
	"time"

	"gorm.io/gorm"
)

type Transaction struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	TenantID     uint           `gorm:"not null;index" json:"tenant_id"`
	CustomerID   uint           `gorm:"not null;index" json:"customer_id"`
	ItemID       uint           `gorm:"not null;index" json:"item_id"`
	RecordedByID uint           `gorm:"index" json:"recorded_by_id"`
	Quantity     int            `gorm:"not null" json:"quantity"`
	UnitPrice    float64        `gorm:"type:decimal(12,2);not null" json:"unit_price"`
	Date         time.Time      `gorm:"not null;index" json:"date"`
	Notes        string         `gorm:"size:500" json:"notes"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Tenant     Tenant   `gorm:"foreignKey:TenantID" json:"-"`
	Customer   Customer `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Item       Item     `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	RecordedBy *User    `gorm:"foreignKey:RecordedByID" json:"recorded_by,omitempty"`
}

// Total calculates the transaction total
func (t *Transaction) Total() float64 {
	return float64(t.Quantity) * t.UnitPrice
}
