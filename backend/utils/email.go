package utils

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"strings"
)

// LogEmail simulates sending an email by logging it to the console
func LogEmail(to, subject, body string) {
	log.Printf("SIMULATED EMAIL TO: %s\nSUBJECT: %s\nBODY: %s\n-------------------", to, subject, body)
}

// GenerateRandomPassword creates a cryptographically secure random alphanumeric password
func GenerateRandomPassword(length int) (string, error) {
	const charset = "abcdefghijklmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	var sb strings.Builder
	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", fmt.Errorf("failed to generate random password: %w", err)
		}
		sb.WriteByte(charset[num.Int64()])
	}
	return sb.String(), nil
}
