package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"invoiceflow/database"
	"invoiceflow/handlers"
	"invoiceflow/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Ensure JWT_SECRET is set
	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}

	// Connect to database
	database.Connect()
	database.Migrate()

	// Initialize Gin router
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     getAllowedOrigins(),
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// API routes
	api := router.Group("/api")
	{
		// Global rate limit for all API routes
		api.Use(middleware.DefaultRateLimiter())

		// Public routes (no auth required)
		auth := api.Group("/auth")
		{
			// Stricter rate limit for login and register
			auth.Use(middleware.AuthRateLimiter())
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// Protected routes (auth required)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// Auth
			protected.GET("/auth/me", handlers.GetMe)

			// ------- ADMIN routes -------
			admin := protected.Group("")
			admin.Use(middleware.AdminRequired())
			{
				// Customers
				admin.GET("/customers", handlers.ListCustomers)
				admin.POST("/customers", handlers.CreateCustomer)
				admin.GET("/customers/:id", handlers.GetCustomer)
				admin.PUT("/customers/:id", handlers.UpdateCustomer)
				admin.DELETE("/customers/:id", handlers.DeleteCustomer)

				// Items
				admin.GET("/items", handlers.ListItems)
				admin.POST("/items", handlers.CreateItem)
				admin.GET("/items/:id", handlers.GetItem)
				admin.PUT("/items/:id", handlers.UpdateItem)
				admin.DELETE("/items/:id", handlers.DeleteItem)

				// Transactions
				admin.GET("/transactions", handlers.ListTransactions)
				admin.POST("/transactions", handlers.CreateTransaction)
				admin.GET("/transactions/:id", handlers.GetTransaction)
				admin.DELETE("/transactions/:id", handlers.DeleteTransaction)

				// Invoices
				admin.GET("/invoices", handlers.ListInvoices)
				admin.POST("/invoices/generate", handlers.GenerateInvoice)
				admin.GET("/invoices/:id", handlers.GetInvoice)
				admin.PUT("/invoices/:id/status", handlers.UpdateInvoiceStatus)
				admin.DELETE("/invoices/:id", handlers.DeleteInvoice)

				// Dashboard
				admin.GET("/dashboard/stats", handlers.GetDashboardStats)

				// Multi-month summary
				admin.POST("/summaries/export", handlers.ExportMultiMonthSummary)
			}

			// ------- CUSTOMER portal routes -------
			portal := protected.Group("/portal")
			portal.Use(middleware.CustomerRequired())
			{
				portal.GET("/dashboard", handlers.GetPortalDashboard)
				portal.GET("/transactions", handlers.ListPortalTransactions)
				portal.GET("/invoices", handlers.ListPortalInvoices)
				portal.PUT("/invoices/:id/approve", handlers.ApprovePortalInvoice)
			}
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server with graceful shutdown
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Failed to start server:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Give outstanding requests 5 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited gracefully")
}

// getAllowedOrigins returns CORS origins from the CORS_ORIGINS env var (comma-separated),
// falling back to localhost origins for development.
func getAllowedOrigins() []string {
	origins := os.Getenv("CORS_ORIGINS")
	if origins == "" {
		return []string{"http://localhost:5173", "http://localhost:3000"}
	}
	return strings.Split(origins, ",")
}
