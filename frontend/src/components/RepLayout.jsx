import { Outlet } from 'react-router-dom';
import RepSidebar from './RepSidebar';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { LogOut, User } from 'lucide-react';

export default function RepLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 border-r border-white/5 bg-card/30 backdrop-blur-xl hidden lg:block">
                <RepSidebar />
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4 lg:hidden">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                            <User size={18} />
                        </div>
                        <h2 className="font-bold tracking-tight">InvoiceFlow</h2>
                    </div>

                    <div className="hidden lg:block">
                        <h3 className="text-sm font-medium text-muted-foreground">Welcome back, <span className="text-foreground font-bold">{user?.name}</span></h3>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-sm font-bold">{user?.name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-primary font-bold">{user?.role}</span>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary font-bold">
                            {user?.name?.charAt(0)}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            onClick={logout}
                        >
                            <LogOut size={20} />
                        </Button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
