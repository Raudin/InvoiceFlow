package models

import (
	"time"

	"gorm.io/gorm"
)

type Tenant struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	BusinessName string         `gorm:"size:150;not null" json:"business_name"`
	Email        string         `gorm:"uniqueIndex;size:254;not null" json:"email"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Users        []User        `gorm:"foreignKey:TenantID" json:"users,omitempty"`
	Customers    []Customer    `gorm:"foreignKey:TenantID" json:"customers,omitempty"`
	Items        []Item        `gorm:"foreignKey:TenantID" json:"items,omitempty"`
	Transactions []Transaction `gorm:"foreignKey:TenantID" json:"transactions,omitempty"`
	Invoices     []Invoice     `gorm:"foreignKey:TenantID" json:"invoices,omitempty"`
}
