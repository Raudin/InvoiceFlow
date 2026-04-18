import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import StatsCard from '../../components/StatsCard';
import api from '../../api/client';
import { PlusCircle, Receipt, Activity, History } from 'lucide-react';
import { format } from 'date-fns';

export default function RepDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/rep/dashboard');
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch rep stats:', error);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
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
                        Rep Dashboard
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Good day! Here's your activity overview.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button className="h-11 px-6 shadow-lg shadow-primary/20" asChild>
                        <a href="/rep/transactions">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Record Transaction
                        </a>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <StatsCard
                    title="Transactions Today"
                    value={stats?.today_transactions_count || '0'}
                    gradient="gradient-text"
                    icon={<Activity className="w-5 h-5 text-white" />}
                />
                <StatsCard
                    title="Last Recording"
                    value={stats?.recent_transactions?.length > 0 ? format(new Date(stats.recent_transactions[0].created_at), 'HH:mm') : 'None'}
                    gradient="gradient-text"
                    icon={<History className="w-5 h-5 text-white" />}
                />
            </div>

            <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        Recent Activity
                    </CardTitle>
                    <CardDescription>Your last 5 recorded transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats?.recent_transactions?.length > 0 ? (
                            stats.recent_transactions.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground">{t.customer?.name}</span>
                                        <span className="text-sm text-muted-foreground">{t.item?.name} (x{t.quantity})</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{format(new Date(t.date), 'MMM dd, yyyy')}</div>
                                        <div className="text-xs text-muted-foreground">{format(new Date(t.created_at), 'HH:mm')}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No transactions recorded yet.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
