import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Package,
    Receipt,
    FileText,
    LogOut,
    PlusCircle,
    ChevronRight,
    TrendingUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Sidebar() {
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Customers', path: '/customers', icon: Users },
        { name: 'Items', path: '/items', icon: Package },
        { name: 'Transactions', path: '/transactions', icon: Receipt },
        { name: 'Invoices', path: '/invoices', icon: FileText },
    ];

    return (
        <div className="flex flex-col h-full py-6 px-4">
            {/* Logo Area */}
            <div className="px-4 mb-10">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="font-black text-xl tracking-tighter leading-none italic gradient-text">InvoiceFlow</h2>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Business Suite</span>
                    </div>
                </Link>
            </div>

            {/* Quick Stats Mini */}
            <div className="px-2 mb-8">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Monthly Target</span>
                        <span className="text-primary font-bold">82%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[82%]" />
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 px-2">
                <p className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4">Main Menu</p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                            ${isActive
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={20}
                                    className={`transition-colors duration-300 ${isActive ? 'text-white' : 'group-hover:text-primary'}`}
                                />
                                <span className="flex-1">{item.name}</span>
                                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-40 transition-opacity ${isActive ? 'hidden' : 'block'}`} />
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Action Card */}
            <div className="px-2 mt-auto pt-6">
                <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/5 border border-primary/10 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-125 transition-transform">
                        <TrendingUp size={48} />
                    </div>
                    <h4 className="text-sm font-bold mb-1">Upgrade Plan</h4>
                    <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">Get unlimited invoices and premium reports.</p>
                    <Button size="sm" className="w-full text-xs font-bold h-8">Go Pro</Button>
                </div>
            </div>
        </div>
    );
}
