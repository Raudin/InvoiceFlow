package middleware

import (
	"log"
	"net/http"
	"os"
	"strings"

	"invoiceflow/utils"

	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	mgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimiter creates a rate limiting middleware
func RateLimiter(rateStr string) gin.HandlerFunc {
	rateStr = strings.TrimSpace(rateStr)
	if rateStr == "" {
		rateStr = "100-H"
	}

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
	return mgin.NewMiddleware(
		instance,
		mgin.WithKeyGetter(func(c *gin.Context) string {
			return c.ClientIP()
		}),
		mgin.WithLimitReachedHandler(func(c *gin.Context) {
			utils.ErrorResponse(c, http.StatusTooManyRequests, "Too many requests, please try again later")
			c.Abort()
		}),
	)
}

// DefaultRateLimiter provides a standard rate limit of 100 requests per hour
func DefaultRateLimiter() gin.HandlerFunc {
	return RateLimiter(getRateLimit("API_RATE_LIMIT", "100-H"))
}

// AuthRateLimiter provides a stricter rate limit for auth routes (e.g., 20 requests per hour)
func AuthRateLimiter() gin.HandlerFunc {
	return RateLimiter(getRateLimit("AUTH_RATE_LIMIT", "20-H"))
}

func getRateLimit(envKey, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(envKey)); value != "" {
		return value
	}
	return fallback
}
