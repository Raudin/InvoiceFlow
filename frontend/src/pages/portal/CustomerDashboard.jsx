import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from '../../api/client';
import {
    Activity,
    FileText,
    CheckCircle2,
    Clock,
    DollarSign,
    TrendingUp
} from 'lucide-react';

export default function CustomerDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/portal/dashboard')
            .then(r => setStats(r.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <Skeleton className="h-10 w-56" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Transactions',
            value: stats?.transaction_count ?? 0,
            icon: Activity,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10 border-blue-400/20'
        },
        {
            label: 'Total Invoices',
            value: stats?.total_invoices ?? 0,
            icon: FileText,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10 border-purple-400/20'
        },
        {
            label: 'Awaiting Approval',
            value: stats?.pending_invoices ?? 0,
            icon: Clock,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10 border-amber-400/20'
        },
        {
            label: 'Approved Invoices',
            value: stats?.approved_invoices ?? 0,
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10 border-emerald-400/20'
        },
    ];

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="space-y-1">
                <h1 className="text-4xl font-extrabold tracking-tight text-emerald-400">My Dashboard</h1>
                <p className="text-muted-foreground text-lg">Welcome back! Here's a summary of your account.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map(({ label, value, icon: Icon, color, bg }) => (
                    <Card key={label} className="bg-card/50 backdrop-blur-sm border-white/10 shadow-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-muted-foreground">{label}</p>
                                <div className={`p-2.5 rounded-xl border ${bg}`}>
                                    <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                            </div>
                            <p className={`text-3xl font-black ${color}`}>{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Total spend + Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Total Spend card */}
                <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                            Total Spend
                        </CardTitle>
                        <CardDescription>Cumulative value of all your invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-black text-emerald-400">
                            ${(stats?.total_spend ?? 0).toFixed(2)}
                        </p>
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-white/10 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            Recent Transactions
                        </CardTitle>
                        <CardDescription>Your 5 most recent recorded transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats?.recent_transactions?.length > 0 ? (
                            <div className="space-y-3">
                                {stats.recent_transactions.map(tx => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                <Activity className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{tx.item?.name ?? 'Item'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-emerald-400">
                                                ${(tx.quantity * tx.unit_price).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Qty: {tx.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm py-4 text-center">No recent transactions</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
