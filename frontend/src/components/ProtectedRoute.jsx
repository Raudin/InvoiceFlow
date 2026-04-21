import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
        </div>
        <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase animate-pulse">Authenticating</p>
    </div>
);

/** Wraps admin-only sections – redirects customers to portal, unauthenticated to login */
export function AdminRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'customer') return <Navigate to="/portal" replace />;
    if (user.role === 'rep') return <Navigate to="/rep/dashboard" replace />;
    return children;
}

/** Wraps customer portal – redirects admins to root, unauthenticated to login */
export function CustomerRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin' || user.role === 'rep') return <Navigate to="/" replace />;
    return children;
}

/** Wraps rep portal – redirects customers to portal, admins to root, unauthenticated to login */
export function RepRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') return <Navigate to="/" replace />;
    if (user.role === 'customer') return <Navigate to="/portal" replace />;
    return children;
}

/** Generic protected route – just requires login */
export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}
