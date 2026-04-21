import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Receipt,
    LogOut,
    ChevronRight,
    FileText
} from 'lucide-react';

export default function RepSidebar() {
    const { logout } = useAuth();

    const navItems = [
        { name: 'Dashboard', path: '/rep/dashboard', icon: LayoutDashboard },
        { name: 'My Transactions', path: '/rep/transactions', icon: Receipt },
    ];

    return (
        <div className="flex flex-col h-full py-6 px-4">
            <div className="px-4 mb-10">
                <Link to="/rep/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="font-black text-xl tracking-tighter leading-none italic gradient-text">InvoiceFlow</h2>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Rep Portal</span>
                    </div>
                </Link>
            </div>

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
                                    className={`transition-colors duration-300 ${isActive ? 'text-black' : 'group-hover:text-primary'}`}
                                />
                                <span className="flex-1">{item.name}</span>
                                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-40 transition-opacity ${isActive ? 'hidden' : 'block'}`} />
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="px-2 mt-auto">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all duration-300 group"
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">Sign Out</span>
                </button>
            </div>
        </div>
    );
}
