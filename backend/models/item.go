package models

import (
	"time"

	"gorm.io/gorm"
)

type Item struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	TenantID    uint           `gorm:"not null;index" json:"tenant_id"`
	Name        string         `gorm:"size:160;not null" json:"name"`
	Description string         `gorm:"size:500" json:"description"`
	UnitPrice   float64        `gorm:"type:decimal(12,2);not null" json:"unit_price"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Tenant       Tenant        `gorm:"foreignKey:TenantID" json:"-"`
	Transactions []Transaction `gorm:"foreignKey:ItemID" json:"transactions,omitempty"`
}
