import { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Receipt,
    FileText,
    LogOut,
    ChevronRight,
    User,
    X,
    Menu
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CustomerLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    const navItems = [
        { name: 'My Dashboard', path: '/portal', icon: LayoutDashboard, exact: true },
        { name: 'My Transactions', path: '/portal/transactions', icon: Receipt },
        { name: 'My Invoices', path: '/portal/invoices', icon: FileText },
    ];

    const Sidebar = () => (
        <div className="flex flex-col h-full py-6 px-4">
            {/* Logo */}
            <div className="px-4 mb-8">
                <Link to="/portal" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
                        <User size={22} />
                    </div>
                    <div>
                        <h2 className="font-black text-xl tracking-tighter leading-none text-emerald-400">Customer</h2>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Portal</span>
                    </div>
                </Link>
            </div>

            {/* User badge */}
            <div className="px-2 mb-8">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <p className="text-xs text-muted-foreground">Logged in as</p>
                    <p className="text-sm font-bold text-emerald-400 truncate">{user?.name || user?.email}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 px-2">
                <p className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4">Navigation</p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                            ${isActive
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={20}
                                    className={`transition-colors duration-300 ${isActive ? 'text-white' : 'group-hover:text-emerald-400'}`}
                                />
                                <span className="flex-1">{item.name}</span>
                                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-40 transition-opacity ${isActive ? 'hidden' : 'block'}`} />
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="px-2 mt-auto pt-6">
                <Button
                    variant="ghost"
                    onClick={logout}
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-red-400 hover:bg-red-500/5 rounded-xl h-12"
                >
                    <LogOut size={18} />
                    <span>Sign out</span>
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 h-screen sticky top-0 border-r border-white/5 bg-card/30 backdrop-blur-xl">
                <Sidebar />
            </aside>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-[70] w-72 bg-card border-r border-white/10 transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-emerald-500/10' : '-translate-x-full'}`}
            >
                <div className="flex flex-col h-full relative">
                    <Sidebar />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute top-4 right-4 h-10 w-10 rounded-full hover:bg-white/5"
                    >
                        <X size={20} />
                    </Button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Topbar */}
                <header className="sticky top-0 z-40 h-16 border-b border-white/5 bg-background/80 backdrop-blur-xl flex items-center px-4 md:px-8 gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden h-9 w-9 rounded-xl"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={18} />
                    </Button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Customer Portal
                        </span>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 lg:p-10 w-full max-w-7xl mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
