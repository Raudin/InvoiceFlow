package models

import (
	"time"

	"gorm.io/gorm"
)

type Customer struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	TenantID  uint           `gorm:"not null;index" json:"tenant_id"`
	Name      string         `gorm:"not null" json:"name"`
	Email     string         `json:"email"`
	Phone     string         `json:"phone"`
	Address   string         `json:"address"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	
	// Relationships
	Tenant       Tenant        `gorm:"foreignKey:TenantID" json:"-"`
	Transactions []Transaction `gorm:"foreignKey:CustomerID" json:"transactions,omitempty"`
	Invoices     []Invoice     `gorm:"foreignKey:CustomerID" json:"invoices,omitempty"`
}
