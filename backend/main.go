package main

import (
	"log"
	"os"

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

	// Connect to database
	database.Connect()
	database.Migrate()

	// Initialize Gin router
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
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

			// Customers
			protected.GET("/customers", handlers.ListCustomers)
			protected.POST("/customers", handlers.CreateCustomer)
			protected.GET("/customers/:id", handlers.GetCustomer)
			protected.PUT("/customers/:id", handlers.UpdateCustomer)
			protected.DELETE("/customers/:id", handlers.DeleteCustomer)

			// Items
			protected.GET("/items", handlers.ListItems)
			protected.POST("/items", handlers.CreateItem)
			protected.GET("/items/:id", handlers.GetItem)
			protected.PUT("/items/:id", handlers.UpdateItem)
			protected.DELETE("/items/:id", handlers.DeleteItem)

			// Transactions
			protected.GET("/transactions", handlers.ListTransactions)
			protected.POST("/transactions", handlers.CreateTransaction)
			protected.GET("/transactions/:id", handlers.GetTransaction)
			protected.DELETE("/transactions/:id", handlers.DeleteTransaction)

			// Invoices
			protected.GET("/invoices", handlers.ListInvoices)
			protected.POST("/invoices/generate", handlers.GenerateInvoice)
			protected.GET("/invoices/:id", handlers.GetInvoice)
			protected.PUT("/invoices/:id/status", handlers.UpdateInvoiceStatus)
			protected.DELETE("/invoices/:id", handlers.DeleteInvoice)

			// Dashboard
			protected.GET("/dashboard/stats", handlers.GetDashboardStats)
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
