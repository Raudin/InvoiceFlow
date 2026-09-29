# InvoiceFlow

A modern, multi-tenant transaction tracking and invoicing system designed for businesses, representatives, and customer management. Built with **Go (Gin)** and **React 19 (Vite, Tailwind CSS, Radix UI)**.

---

## Table of Contents

- [Features & Role-Based Access Control](#features--role-based-access-control)
  - [Admin / Finance Role](#1-admin--finance-role)
  - [Representative (Rep) Role](#2-representative-rep-role)
  - [Customer Portal Role](#3-customer-portal-role)
  - [Security & Authentication](#4-security--authentication)
- [Tech Stack](#tech-stack)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Database & Infrastructure](#database--infrastructure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Option A: Running with Docker Compose](#option-a-running-with-docker-compose-recommended)
  - [Option B: Local Development Setup](#option-b-local-development-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [License](#license)

---

## Features & Role-Based Access Control

InvoiceFlow supports a strict role-based access control (RBAC) model with three primary user roles:

### 1. Admin / Finance Role
- **Tenant Management**: Multi-tenant isolation ensuring each business operates in complete security.
- **Representative Management**: Create, edit, and toggle active/inactive status for field representatives (`IsActive`). Passwords and login details are securely sent via email notifications.
- **Customer Management**: Full CRUD operations for invoice recipients, tracking contact details and billing addresses.
- **Item Catalog Management**: Create and manage products/services, setting default unit prices and descriptions.
- **Transaction Controls**: Full control to view, create, edit, or delete any recorded transaction.
- **Automated Monthly Invoicing**: Generate aggregated monthly invoices for customers based on recorded transaction items.
- **Invoice Management**: Control invoice lifecycles (Draft → Sent → Paid) and delete or adjust invoices.
- **Multi-Month Excel Export**: Generate comprehensive Excel spreadsheets aggregating transaction data across custom date ranges.
- **Dashboard & Analytics**: Overview of total revenue, pending/paid invoices, recent transactions, and business metrics.

### 2. Representative (Rep) Role
- **Field Operations**: Record daily transactions on the go with select customer and item catalog options.
- **24-Hour Edit Window**: Representatives can edit or delete their own transactions within a 24-hour window from creation time. Beyond 24 hours, modifications require Admin intervention.
- **Price Masking**: Representatives are restricted from viewing or modifying item prices, maintaining operational privacy.
- **Rep Dashboard**: Metrics tailored to the representative's personal performance and activity logs.

### 3. Customer Portal Role
- **Self-Service Dashboard**: Customers can log in to view their account summary and recent transaction logs.
- **Invoice Overview & Approval**: Review detailed line-item monthly invoices and approve invoices online.
- **Transaction Transparency**: Access real-time itemized delivery/service transaction history.

### 4. Security & Authentication
- **JWT Token Authentication**: Secure token-based access verified against the database on every request to ensure immediate access revocation if an account is disabled or soft-deleted.
- **Rate Limiting**: Built-in global and strict endpoint rate limiting for sensitive auth routes (login, registration, password resets).
- **Forgot & Reset Password**: Token-based password recovery flow with email notifications.
- **Atomic Operations**: High-performance batch transaction processing with database-level transactions ensuring atomicity and data consistency.

---

## Tech Stack

### Backend
- **Go**: Version 1.25.5
- **Framework**: Gin (`github.com/gin-gonic/gin`)
- **ORM**: GORM (`gorm.io/gorm`) with MySQL driver
- **Authentication**: JWT (`golang.org/x/crypto`, `github.com/golang-jwt/jwt/v5`)
- **Rate Limiting**: `github.com/ulule/limiter/v3`
- **Spreadsheets**: Excelize v2 (`github.com/xuri/excelize/v2`)
- **Testing**: In-memory SQLite driver (`github.com/glebarez/sqlite`)

### Frontend
- **React**: Version 19
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4, PostCSS, Framer Motion
- **UI Components**: Radix UI primitives, Shadcn UI components, Lucide React icons
- **Notifications**: Sonner
- **Data Export**: XLSX & XLSX JS Style (`xlsx-js-style`)
- **HTTP Client**: Axios
- **Routing**: React Router v7

### Database & Infrastructure
- **Database**: MySQL 8.0
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Traefik (with TLS/Let's Encrypt support)

---

## Prerequisites

- **Go**: 1.25+ (for local backend development)
- **Node.js**: 18+ (for local frontend development)
- **MySQL**: 8.0+ (or Docker)
- **Docker & Docker Compose**: (optional, for containerized execution)

---

## Getting Started

### Option A: Running with Docker Compose (Recommended)

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd InvoiceFlow
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in necessary database and JWT secrets:
   ```bash
   cp .env.example .env
   ```

3. **Start All Services**:
   ```bash
   docker-compose up -d --build
   ```
   This will spin up MySQL 8.0, the Go backend service on port `8080`, and the React frontend on port `80` (or configured Traefik host).

---

### Option B: Local Development Setup

#### 1. Setup MySQL Database
Ensure MySQL is running locally and create a database:
```sql
CREATE DATABASE invoiceflow;
```

#### 2. Backend Setup
```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env with your MySQL credentials:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=yourpassword
# DB_NAME=invoiceflow
# JWT_SECRET=your-secret-key

# Download dependencies
go mod download

# Start the Go server
go run main.go
```
The backend API server will run at `http://localhost:8080`.

#### 3. Frontend Setup
```bash
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```
The React frontend application will run at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `8080` |
| `DB_HOST` | Database host | `localhost` or `db` |
| `DB_PORT` | Database port | `3306` |
| `DB_USER` | Database user | `invoiceflow` |
| `DB_PASSWORD` | Database password | `secret` |
| `DB_NAME` | Database name | `invoiceflow` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | `supersecretkey` |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:5173,http://localhost:3000` |
| `SMTP_HOST` | SMTP server host for sending emails | `smtp.example.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `user@example.com` |
| `SMTP_PASS` | SMTP password | `password` |
| `SMTP_FROM` | Sender email address | `no-reply@example.com` |
| `APP_URL` | Application URL for password reset links | `http://localhost:5173` |

---

## API Endpoints

### Public / Auth Endpoints (`/api/auth`)
- `POST /api/auth/register` - Register a new tenant & admin user
- `POST /api/auth/login` - Authenticate user and obtain JWT token
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token

### Protected User Profile Endpoints
- `GET /api/auth/me` - Fetch authenticated user profile
- `PUT /api/auth/me` - Update profile information

### Admin Endpoints (Require Admin Role)
- **Customers**:
  - `GET /api/customers` - List all customers
  - `POST /api/customers` - Create customer
  - `GET /api/customers/:id` - Get customer details
  - `PUT /api/customers/:id` - Update customer
  - `DELETE /api/customers/:id` - Delete customer
- **Items Catalog**:
  - `GET /api/items` - List items
  - `POST /api/items` - Create item
  - `GET /api/items/:id` - Get item details
  - `PUT /api/items/:id` - Update item
  - `DELETE /api/items/:id` - Delete item
- **Transactions**:
  - `GET /api/transactions` - List transactions
  - `POST /api/transactions` - Batch record transactions
  - `GET /api/transactions/:id` - Get transaction details
  - `PUT /api/transactions/:id` - Update transaction
  - `DELETE /api/transactions/:id` - Delete transaction
- **Invoices & Summaries**:
  - `GET /api/invoices` - List generated invoices
  - `POST /api/invoices/generate` - Generate monthly aggregated invoice
  - `GET /api/invoices/:id` - Get invoice details
  - `PUT /api/invoices/:id/status` - Update invoice status
  - `DELETE /api/invoices/:id` - Delete invoice
  - `POST /api/summaries/export` - Export multi-month Excel summary
- **Representative Management**:
  - `GET /api/reps` - List field representatives
  - `POST /api/reps` - Register field representative
  - `PUT /api/reps/:id` - Update representative profile
  - `PATCH /api/reps/:id/toggle` - Toggle representative active status
  - `DELETE /api/reps/:id` - Delete representative
- **Dashboard**:
  - `GET /api/dashboard/stats` - Get admin analytics metrics

### Representative Endpoints (`/api/rep`)
- `GET /api/rep/dashboard` - Get representative performance dashboard
- `GET /api/rep/transactions` - List transactions created by rep
- `POST /api/rep/transactions` - Record new transaction
- `PUT /api/rep/transactions/:id` - Edit transaction (within 24 hours of creation)
- `DELETE /api/rep/transactions/:id` - Delete transaction (within 24 hours of creation)
- `GET /api/rep/customers` - View customer list
- `GET /api/rep/items` - View item catalog (prices masked)

### Customer Portal Endpoints (`/api/portal`)
- `GET /api/portal/dashboard` - Get customer overview dashboard
- `GET /api/portal/transactions` - View itemized delivery history
- `GET /api/portal/invoices` - View generated invoices
- `PUT /api/portal/invoices/:id/approve` - Approve invoice online

---

## Project Structure

```
InvoiceFlow/
├── backend/
│   ├── database/         # Database connection & migrations
│   ├── handlers/         # API HTTP handlers (Auth, Customer, Item, Invoice, Rep, Portal)
│   ├── middleware/       # Auth JWT verification, RBAC, and Rate limiters
│   ├── models/           # GORM Database models & structs
│   ├── utils/            # Helper functions (Response, Email, Passwords)
│   ├── Dockerfile        # Backend container build configuration
│   ├── go.mod            # Go module definition
│   └── main.go           # Application entrypoint
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios HTTP client configuration
│   │   ├── components/   # UI components (Shadcn UI, Radix, Navbar, Layouts)
│   │   ├── context/      # React Authentication Context
│   │   ├── pages/        # Page components (Admin, Rep, Portal dashboards & views)
│   │   ├── App.jsx       # Root React routing component
│   │   └── main.jsx      # Frontend application entrypoint
│   ├── Dockerfile        # Frontend container build configuration
│   ├── nginx.conf        # Nginx server configuration for frontend container
│   ├── package.json      # Frontend npm dependencies
│   └── vite.config.js    # Vite configuration
├── docker-compose.yml    # Multi-container service definition
└── README.md             # Project documentation
```

---

## Testing

Backend unit and handler tests use an in-memory SQLite database:

```bash
cd backend
go test ./...
```

---

## License

MIT License
