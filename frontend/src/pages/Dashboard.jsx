import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AppNavbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import api from '../api/client';
import { PlusCircle, FileText, Users, ArrowUpRight, ArrowDownRight, CreditCard, Activity } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/dashboard/stats');
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl gradient-text">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Welcome back! Here's what's happening with your business today.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-11 px-6 border-white/10 bg-white/5 hover:bg-white/10">
                        <Activity className="mr-2 h-4 w-4" />
                        View Reports
                    </Button>
                    <Button className="h-11 px-6 shadow-lg shadow-primary/20">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Document
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatsCard
                    title="Total Revenue"
                    value={`$${stats?.total_revenue?.toFixed(2) || '0.00'}`}
                    gradient="gradient-text"
                    icon={<CreditCard className="w-5 h-5 text-white" />}
                />
                <StatsCard
                    title="Pending Invoices"
                    value={stats?.pending_invoices || '0'}
                    gradient="gradient-text"
                    icon={<FileText className="w-5 h-5 text-white" />}
                />
                <StatsCard
                    title="Total Transactions"
                    value={stats?.transaction_count || '0'}
                    gradient="gradient-text"
                    icon={<Activity className="w-5 h-5 text-white" />}
                />
                <StatsCard
                    title="Active Customers"
                    value={stats?.customer_count || '0'}
                    gradient="gradient-text"
                    icon={<Users className="w-5 h-5 text-white" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-white/10 shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                        <div className="space-y-1.5">
                            <CardTitle className="text-2xl font-bold">Quick Actions</CardTitle>
                            <CardDescription>Streamline your workflow with these shortcuts</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <QuickActionButton
                                title="Record Transaction"
                                description="Add daily business activity"
                                icon={<Activity className="w-5 h-4" />}
                                href="/transactions"
                            />
                            <QuickActionButton
                                title="Generate Invoice"
                                description="Create monthly billing"
                                icon={<FileText className="w-5 h-4" />}
                                href="/invoices"
                            />
                            <QuickActionButton
                                title="Manage Customers"
                                description="View and edit contacts"
                                icon={<Users className="w-5 h-4" />}
                                href="/customers"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-xl overflow-hidden group">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Business Growth</CardTitle>
                        <CardDescription>Performance vs last month</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                                    <p className="text-xl font-bold text-emerald-500">+12.5%</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                                    <ArrowDownRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                                    <p className="text-xl font-bold text-amber-500">-3.2%</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function QuickActionButton({ title, description, icon, href }) {
    return (
        <a
            href={href}
            className="group block p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 transform hover:-translate-y-1 shadow-sm"
        >
            <div className="flex flex-col gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
            </div>
        </a>
    );
}
