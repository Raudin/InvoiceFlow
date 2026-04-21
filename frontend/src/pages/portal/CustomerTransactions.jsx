import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from '../../api/client';
import { Receipt, Package } from 'lucide-react';

export default function CustomerTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/portal/transactions')
            .then(r => setTransactions(r.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Group transactions by date
    const grouped = transactions.reduce((acc, tx) => {
        const dateKey = new Date(tx.date).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(tx);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <Skeleton className="h-10 w-56" />
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="space-y-1">
                <h1 className="text-4xl font-extrabold tracking-tight text-emerald-400">My Transactions</h1>
                <p className="text-muted-foreground text-lg">A complete read-only view of your recorded transactions.</p>
            </div>

            {Object.keys(grouped).length === 0 ? (
                <Card className="bg-card/50 border-white/10">
                    <CardContent className="py-16 text-center">
                        <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No transactions found for your account.</p>
                    </CardContent>
                </Card>
            ) : (
                Object.entries(grouped).map(([date, txs]) => {
                    const dayTotal = txs.reduce((sum, tx) => sum + tx.quantity * tx.unit_price, 0);
                    return (
                        <Card key={date} className="bg-card/50 backdrop-blur-sm border-white/10 shadow-xl overflow-hidden">
                            <CardHeader className="pb-3 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold">{date}</CardTitle>
                                    <span className="text-emerald-400 font-bold text-sm">
                                        Total: KES {dayTotal.toFixed(2)}
                                    </span>
                                </div>
                                <CardDescription>{txs.length} item{txs.length !== 1 ? 's' : ''}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-white/5">
                                    {txs.map(tx => (
                                        <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/3 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                    <Package className="w-4 h-4 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{tx.item?.name ?? '—'}</p>
                                                    {tx.notes && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">{tx.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-emerald-400">
                                                    KES {(tx.quantity * tx.unit_price).toFixed(2)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {tx.quantity} × KES {tx.unit_price?.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </div>
    );
}
