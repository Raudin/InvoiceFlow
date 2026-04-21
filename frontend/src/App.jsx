import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { AdminRoute, CustomerRoute, RepRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import CustomerLayout from './components/CustomerLayout';
import RepLayout from './components/RepLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Reps from './pages/Reps';
import Items from './pages/Items';
import Transactions from './pages/Transactions';
import Invoices from './pages/Invoices';
import CustomerDashboard from './pages/portal/CustomerDashboard';
import CustomerTransactions from './pages/portal/CustomerTransactions';
import CustomerInvoices from './pages/portal/CustomerInvoices';
import RepDashboard from './pages/rep/RepDashboard';
import RepTransactions from './pages/rep/RepTransactions';
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin Routes */}
            <Route element={<AdminRoute><Layout /></AdminRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reps" element={<Reps />} />
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

            {/* Rep Portal Routes */}
            <Route element={<RepRoute><RepLayout /></RepRoute>}>
              <Route path="/rep/dashboard" element={<RepDashboard />} />
              <Route path="/rep/transactions" element={<RepTransactions />} />
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
