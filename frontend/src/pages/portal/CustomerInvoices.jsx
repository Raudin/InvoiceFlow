import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from '../../api/client';
import { FileText, CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
    draft: { label: 'Draft', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
    sent: { label: 'Sent', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    approved: { label: 'Approved', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    paid: { label: 'Paid', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CustomerInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const fetchInvoices = () => {
        api.get('/portal/invoices')
            .then(r => setInvoices(r.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchInvoices(); }, []);

    const handleApprove = async (invoiceId) => {
        setApprovingId(invoiceId);
        try {
            await api.put(`/portal/invoices/${invoiceId}/approve`);
            toast.success('Invoice approved successfully!');
            fetchInvoices();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to approve invoice');
        } finally {
            setApprovingId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <Skeleton className="h-10 w-48" />
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="space-y-1">
                <h1 className="text-4xl font-extrabold tracking-tight text-emerald-400">My Invoices</h1>
                <p className="text-muted-foreground text-lg">
                    Review and approve your invoices. Approved invoices can be exported by your provider.
                </p>
            </div>

            {invoices.length === 0 ? (
                <Card className="bg-card/50 border-white/10">
                    <CardContent className="py-16 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No invoices issued to your account yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {invoices.map(inv => {
                        const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
                        const canApprove = inv.status === 'draft' || inv.status === 'sent';
                        const isExpanded = expandedId === inv.id;

                        return (
                            <Card key={inv.id} className="bg-card/50 backdrop-blur-sm border-white/10 shadow-xl overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-bold">{inv.invoice_number}</CardTitle>
                                            <CardDescription>
                                                {MONTHS[(inv.month ?? 1) - 1]} {inv.year}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <Badge className={`border text-xs font-semibold px-3 py-1 rounded-full ${cfg.className}`}>
                                                {cfg.label}
                                            </Badge>
                                            <span className="text-xl font-black text-emerald-400">
                                                KES {inv.total?.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                                        {canApprove && (
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 h-9"
                                                onClick={() => handleApprove(inv.id)}
                                                disabled={approvingId === inv.id}
                                            >
                                                {approvingId === inv.id ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                )}
                                                Approve Invoice
                                            </Button>
                                        )}
                                        {inv.status === 'approved' && (
                                            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Approved {inv.approved_at ? `on ${new Date(inv.approved_at).toLocaleDateString()}` : ''}
                                            </div>
                                        )}
                                        {inv.line_items?.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="ml-auto text-muted-foreground hover:text-foreground"
                                                onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                                                {isExpanded ? 'Hide' : 'View'} Line Items
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>

                                {/* Collapsible line items */}
                                {isExpanded && inv.line_items?.length > 0 && (
                                    <CardContent className="border-t border-white/5 pt-4">
                                        <div className="space-y-2">
                                            {inv.line_items.map(li => (
                                                <div key={li.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/5 border border-white/5">
                                                    <div>
                                                        <p className="text-sm font-semibold">{li.item_name}</p>
                                                        {li.description && (
                                                            <p className="text-xs text-muted-foreground">{li.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right text-sm">
                                                        <p className="font-bold text-emerald-400">KES {li.total?.toFixed(2)}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {li.quantity} × KES {li.unit_price?.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
