package models

import (
	"time"

	"gorm.io/gorm"
)

type Customer struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	TenantID  uint           `gorm:"not null;index" json:"tenant_id"`
	Name      string         `gorm:"size:120;not null" json:"name"`
	Email     string         `gorm:"size:254" json:"email"`
	Phone     string         `gorm:"size:32" json:"phone"`
	Address   string         `gorm:"size:500" json:"address"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Tenant       Tenant        `gorm:"foreignKey:TenantID" json:"-"`
	Transactions []Transaction `gorm:"foreignKey:CustomerID" json:"transactions,omitempty"`
	Invoices     []Invoice     `gorm:"foreignKey:CustomerID" json:"invoices,omitempty"`
}
