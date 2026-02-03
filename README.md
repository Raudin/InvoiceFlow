# InvoiceFlow

A modern, multi-tenant transaction tracking and invoicing system built with Go (Gin) and React (Hero UI).

## Features

- **Multi-Tenant Architecture** - Each business operates in complete isolation
- **JWT Authentication** - Secure user authentication with token-based auth
- **Customer Management** - Track and manage invoice recipients
- **Item Catalog** - Maintain your billable services/products
- **Daily Transactions** - Record transactions with customer, item, quantity, and date
- **Monthly Invoicing** - Automatically aggregate transactions into monthly invoices
- **Dashboard Analytics** - View revenue, pending invoices, and transaction metrics
- **Modern UI** - Beautiful dark theme with glassmorphism effects using Hero UI

## Tech Stack

### Backend
- **Go 1.20+** - High-performance backend
- **Gin** - HTTP web framework
- **GORM** - ORM for PostgreSQL
- **PostgreSQL** - Primary database
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Hero UI** - Component library
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Framer Motion** - Animations

## Prerequisites

- **Go** 1.20 or higher
- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher
- **Git**

## Installation

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd InvoiceFlow
\`\`\`

### 2. Setup PostgreSQL Database

Create a PostgreSQL database:

\`\`\`sql
CREATE DATABASE invoiceflow;
\`\`\`

### 3. Backend Setup

\`\`\`bash
cd backend

# Copy environment file
cp .env.example .env

# Update .env with your database credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=invoiceflow
# JWT_SECRET=your-super-secret-jwt-key

# Install dependencies (already done via go mod)
go mod download

# Run the server
go run main.go
\`\`\`

The backend will start on **http://localhost:8080**

### 4. Frontend Setup

\`\`\`bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

The frontend will start on **http://localhost:5173**

## Usage

### 1. Register Your Business

- Navigate to http://localhost:5173/register
- Enter your business name, name, email, and password
- Click "Create Account"

### 2. Add Customers

- Go to the Customers page
- Click "Add Customer"
- Fill in customer details (name, email, phone, address)

### 3. Create Item Catalog

- Go to the Items page
- Click "Add Item"
- Enter item name, description, and unit price

### 4. Record Transactions

- Go to the Transactions page
- Click "Record Transaction"
- Select customer, item, enter quantity and date
- Transactions are stored with the unit price at the time of recording

### 5. Generate Monthly Invoice

- Go to the Invoices page
- Click "Generate Invoice"
- Select customer, month, and year
- The system will automatically:
  - Aggregate all transactions for that customer in that month
  - Group by item with total quantities
  - Calculate line items and total amount
  - Generate a unique invoice number

### 6. Manage Invoice Status

- View invoice details to see line items
- Update status: Draft → Sent → Paid

## API Endpoints

### Public Endpoints
- `POST /api/auth/register` - Register new tenant & user
- `POST /api/auth/login` - Login and get JWT token

### Protected Endpoints (Require JWT Token)
- `GET /api/auth/me` - Get current user
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET/PUT/DELETE /api/customers/:id` - Customer operations
- `GET /api/items` - List items
- `POST /api/items` - Create item
- `GET/PUT/DELETE /api/items/:id` - Item operations
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET/DELETE /api/transactions/:id` - Transaction operations
- `GET /api/invoices` - List invoices
- `POST /api/invoices/generate` - Generate monthly invoice
- `GET /api/invoices/:id` - Get invoice with line items
- `PUT /api/invoices/:id/status` - Update invoice status
- `GET /api/dashboard/stats` - Dashboard statistics

## Project Structure

\`\`\`
InvoiceFlow/
├── backend/
│   ├── main.go              # Entry point
│   ├── models/              # Database models
│   ├── handlers/            # API handlers
│   ├── middleware/          # Auth middleware
│   ├── database/            # DB connection
│   └── utils/               # Helper functions
├── frontend/
│   ├── src/
│   │   ├── api/            # API client
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Auth context
│   │   ├── pages/          # Page components
│   │   ├── App.jsx         # Main app
│   │   └── main.jsx        # Entry point
│   └── index.html
└── README.md
\`\`\`

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 8080)
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT tokens

## Development

### Running Backend
\`\`\`bash
cd backend
go run main.go
\`\`\`

### Running Frontend
\`\`\`bash
cd frontend
npm run dev
\`\`\`

### Building for Production

**Backend:**
\`\`\`bash
cd backend
go build -o invoiceflow
\`\`\`

**Frontend:**
\`\`\`bash
cd frontend
npm run build
\`\`\`

## License

MIT

## Support

For support, email your-email@example.com or create an issue in the repository.
