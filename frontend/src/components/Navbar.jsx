import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, Users, Package, Receipt, ArrowLeftRight, LogOut, User, Building, Menu, Bell, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

export default function AppNavbar({ onMenuClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuClick}
                        className="lg:hidden h-10 w-10 rounded-full hover:bg-white/5"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <div className="hidden md:flex relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search everything..."
                            className="pl-10 bg-white/5 border-white/5 h-9 w-[300px] lg:w-[400px] rounded-full focus:w-[450px] transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white/5 relative">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                    </Button>

                    <div className="h-8 w-[1px] bg-white/10 mx-1" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative flex items-center gap-3 pl-2 pr-1 h-11 rounded-full border border-white/10 hover:bg-white/10 transition-all">
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className="text-sm font-bold leading-none">{user?.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Administrator</span>
                                </div>
                                <Avatar className="h-8 w-8 border border-white/10 ring-2 ring-primary/20">
                                    <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} alt={user?.name} />
                                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                                        {user?.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal py-4">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-base font-bold leading-none">{user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground mt-1">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="focus:bg-white/5 py-3 cursor-pointer group">
                                <Building className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Business</span>
                                    <span className="font-medium text-sm">{user?.business_name}</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-white/5 py-3 cursor-pointer group">
                                <User className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="font-medium">Account Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                                className="focus:bg-destructive/10 focus:text-destructive py-3 cursor-pointer text-destructive font-bold"
                                onClick={logout}
                            >
                                <LogOut className="mr-3 h-4 w-4" />
                                <span>Sign Out Safely</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
