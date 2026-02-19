import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { AdminRoute, CustomerRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import CustomerLayout from './components/CustomerLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Items from './pages/Items';
import Transactions from './pages/Transactions';
import Invoices from './pages/Invoices';
import CustomerDashboard from './pages/portal/CustomerDashboard';
import CustomerTransactions from './pages/portal/CustomerTransactions';
import CustomerInvoices from './pages/portal/CustomerInvoices';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="dark text-foreground bg-background min-h-screen font-sans antialiased">
          <Toaster richColors position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Routes */}
            <Route element={<AdminRoute><Layout /></AdminRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/items" element={<Items />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/invoices" element={<Invoices />} />
            </Route>

            {/* Customer Portal Routes */}
            <Route element={<CustomerRoute><CustomerLayout /></CustomerRoute>}>
              <Route path="/portal" element={<CustomerDashboard />} />
              <Route path="/portal/transactions" element={<CustomerTransactions />} />
              <Route path="/portal/invoices" element={<CustomerInvoices />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
