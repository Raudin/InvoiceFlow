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

	// Connect to database
	database.Connect()
	database.Migrate()

	// Fail fast if JWT_SECRET is missing
	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}

	// Initialize Gin router
	router := gin.Default()
	configureTrustedProxies(router)

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
			auth.POST("/forgot-password", handlers.ForgotPassword)
			auth.POST("/reset-password", handlers.ResetPassword)
		}

		// Protected routes (auth required)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// Auth
			protected.GET("/auth/me", handlers.GetMe)
			protected.PUT("/auth/me", handlers.UpdateMe)

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
				admin.PUT("/transactions/:id", handlers.UpdateTransaction)
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

				// Representatives
				admin.GET("/reps", handlers.ListReps)
				admin.POST("/reps", handlers.CreateRep)
				admin.PUT("/reps/:id", handlers.UpdateRep)
				admin.PATCH("/reps/:id/toggle", handlers.ToggleRepStatus)
				admin.DELETE("/reps/:id", handlers.DeleteRep)
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

			// ------- REPRESENTATIVE routes -------
			rep := protected.Group("/rep")
			rep.Use(middleware.RepRequired())
			{
				rep.GET("/dashboard", handlers.GetRepDashboardStats)
				rep.GET("/transactions", handlers.ListTransactions)
				rep.POST("/transactions", handlers.CreateTransaction)
				rep.PUT("/transactions/:id", handlers.UpdateTransaction)
				rep.DELETE("/transactions/:id", handlers.DeleteTransaction)
				rep.GET("/customers", handlers.ListCustomers)
				rep.GET("/items", handlers.ListItems)
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

	seen := make(map[string]bool)
	var allowed []string
	for _, origin := range strings.Split(origins, ",") {
		origin = strings.TrimSpace(origin)
		if origin != "" && !seen[origin] {
			allowed = append(allowed, origin)
			seen[origin] = true
		}
	}
	return allowed
}

func configureTrustedProxies(router *gin.Engine) {
	raw := strings.TrimSpace(os.Getenv("TRUSTED_PROXIES"))
	if raw == "" {
		if err := router.SetTrustedProxies(nil); err != nil {
			log.Println("Failed to disable trusted proxies:", err)
		}
		return
	}

	var proxies []string
	for _, proxy := range strings.Split(raw, ",") {
		proxy = strings.TrimSpace(proxy)
		if proxy != "" {
			proxies = append(proxies, proxy)
		}
	}
	if err := router.SetTrustedProxies(proxies); err != nil {
		log.Println("Failed to configure trusted proxies:", err)
	}
}
