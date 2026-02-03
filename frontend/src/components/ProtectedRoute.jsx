import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
                <div className="relative">
                    <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-pulse" />
                    <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
                </div>
                <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase animate-pulse">Authenticating</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
