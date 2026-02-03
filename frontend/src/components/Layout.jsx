import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppNavbar from './Navbar';
import { Menu, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 h-screen sticky top-0 border-r border-white/5 bg-card/30 backdrop-blur-xl">
                <Sidebar />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-[70] w-72 bg-card border-r border-white/10 transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-primary/20' : '-translate-x-full'
                    }`}
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

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
                {/* Global Topbar / Navbar */}
                <AppNavbar onMenuClick={() => setIsMobileMenuOpen(true)} />

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 lg:p-10 w-full max-w-7xl mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
