package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primarykey" json:"id"`
	TenantID     uint           `gorm:"not null;index" json:"tenant_id"`
	CustomerID   *uint          `gorm:"index" json:"customer_id"`
	Name         string         `gorm:"size:120;not null" json:"name"`
	Email        string         `gorm:"uniqueIndex;size:254;not null" json:"email"`
	PasswordHash string         `gorm:"size:255;not null" json:"-"`
	Role         string         `gorm:"size:32;default:'admin'" json:"role"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	ResetToken   string         `gorm:"size:128;index" json:"-"`
	ResetExpires *time.Time     `json:"-"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Tenant   Tenant    `gorm:"foreignKey:TenantID" json:"tenant,omitempty"`
	Customer *Customer `gorm:"foreignKey:CustomerID" json:"-"`
}

// HashPassword hashes the user's password
func (u *User) HashPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hash)
	return nil
}

// CheckPassword verifies the password
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}
