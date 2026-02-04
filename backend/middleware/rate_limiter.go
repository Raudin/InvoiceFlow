package middleware

import (
	"log"
	"net/http"

	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	mgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimiter creates a rate limiting middleware
func RateLimiter(rateStr string) gin.HandlerFunc {
	// Parse the rate string (e.g., "100-H" for 100 requests per hour)
	rate, err := limiter.NewRateFromFormatted(rateStr)
	if err != nil {
		log.Fatal("Invalid rate limit configuration:", err)
	}

	// Create a memory store (you can swap this for Redis later if needed)
	store := memory.NewStore()

	// Create a new limiter
	instance := limiter.New(store, rate)

	// Return the Gin middleware
	return mgin.NewMiddleware(instance, mgin.WithLimitReachedHandler(func(c *gin.Context) {
		utils.ErrorResponse(c, http.StatusTooManyRequests, "Too many requests, please try again later")
	}))
}

// DefaultRateLimiter provides a standard rate limit of 100 requests per hour
func DefaultRateLimiter() gin.HandlerFunc {
	return RateLimiter("100-H")
}

// AuthRateLimiter provides a stricter rate limit for auth routes (e.g., 20 requests per hour)
func AuthRateLimiter() gin.HandlerFunc {
	return RateLimiter("20-H")
}
