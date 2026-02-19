import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import api from '../api/client';
import * as XLSX from 'xlsx-js-style';
import { useAuth } from '../context/AuthContext';
import {
    FileText,
    Search,
    Eye,
    Send,
    CheckCircle2,
    Download,
    Printer,
    Calendar,
    Building,
    User,
    PlusCircle,
    ArrowUpRight
} from 'lucide-react';

export default function Invoices() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ customer_id: '', month: (new Date().getMonth() + 1).toString(), year: new Date().getFullYear().toString() });
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedPeriods, setSelectedPeriods] = useState([{ month: (new Date().getMonth() + 1).toString(), year: new Date().getFullYear().toString() }]);
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [invRes, custRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/customers')
            ]);
            setInvoices(invRes.data.data);
            setCustomers(custRes.data.data);
        } finally {
            setLoading(false);
        }
    };

    const handleExportMultiMonth = async () => {
        if (selectedCustomers.length === 0) {
            alert('Please select at least one customer');
            return;
        }

        if (selectedPeriods.length === 0) {
            alert('Please add at least one period');
            return;
        }

        try {
            const response = await api.post('/summaries/export', {
                customer_ids: selectedCustomers.map(c => parseInt(c.id)),
                periods: selectedPeriods.map(p => ({
                    month: parseInt(p.month),
                    year: parseInt(p.year)
                }))
            }, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            let customerName = 'Customer';
            if (selectedCustomers.length === 1) {
                const selectedId = selectedCustomers[0].id;
                customerName = customers.find(c => c.id.toString() === selectedId.toString())?.name || 'Customer';
            } else if (selectedCustomers.length > 1) {
                customerName = 'Customers';
            }
            link.setAttribute('download', `${customerName}_Report.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setIsGenerateOpen(false);
        } catch (error) {
            console.error('Export Error:', error);
            const message = error.response?.data?.message || error.message || 'Failed to export multi-month summary';
            alert(`Export Failed: ${message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const tasks = [];
            selectedCustomers.forEach((cust) => {
                selectedPeriods.forEach((p) => {
                    const data = {
                        customer_id: parseInt(cust.id),
                        month: parseInt(p.month),
                        year: parseInt(p.year),
                    };
                    tasks.push({
                        customer: cust,
                        period: { month: data.month, year: data.year },
                        promise: api.post('/invoices/generate', data),
                    });
                });
            });

            if (tasks.length === 0) {
                return;
            }

            const results = await Promise.allSettled(tasks.map((t) => t.promise));

            const failedDetails = [];
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const task = tasks[index];
                    const error = result.reason;
                    const errorMessage =
                        error?.response?.data?.message ||
                        error?.message ||
                        'Unknown error';
                    const customerId = task.customer?.id ?? 'unknown';
                    const customerName = task.customer?.name;
                    const customerLabel = customerName
                        ? `${customerName} (ID: ${customerId})`
                        : `ID: ${customerId}`;
                    failedDetails.push(
                        `- Customer ${customerLabel} – ${task.period.month}/${task.period.year}: ${errorMessage}`
                    );
                }
            });

            if (failedDetails.length > 0) {
                const message = `Failed to generate invoices for the following combinations:\n${failedDetails.join(
                    '\n'
                )}`;
                alert(message);
                return;
            }

            fetchData();
            setIsGenerateOpen(false);
            setFormData({
                customer_id: '',
                month: (new Date().getMonth() + 1).toString(),
                year: new Date().getFullYear().toString(),
            });
            setSelectedPeriods([
                {
                    month: (new Date().getMonth() + 1).toString(),
                    year: new Date().getFullYear().toString(),
                },
            ]);
            setSelectedCustomers([]);
        } catch (error) {
            alert(error?.response?.data?.message || 'Failed to generate invoices');
            setIsGenerateOpen(false);
            setFormData({ customer_id: '', month: (new Date().getMonth() + 1).toString(), year: new Date().getFullYear().toString() });
            setSelectedPeriods([{ month: (new Date().getMonth() + 1).toString(), year: new Date().getFullYear().toString() }]);
            setSelectedCustomers([]);
        }
    };

    const viewInvoice = async (id) => {
        try {
            const response = await api.get(`/invoices/${id}`);
            setSelectedInvoice(response.data.data);
            setIsDetailOpen(true);
        } catch (error) {
            alert('Failed to load invoice details');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/invoices/${id}/status`, { status });
            fetchData();
            if (selectedInvoice?.id === id) {
                const response = await api.get(`/invoices/${id}`);
                setSelectedInvoice(response.data.data);
            }
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">PAID</Badge>;
            case 'sent':
                return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">SENT</Badge>;
            case 'approved':
                return <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 px-2.5 py-0.5 rounded-full font-bold">APPROVED</Badge>;
            default:
                return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase">{status}</Badge>;
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight gradient-text font-serif">Invoices</h1>
                    <p className="text-muted-foreground text-lg">Billing, payment tracking, and financial history.</p>
                </div>

                <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-xl shadow-primary/20 h-11 px-6 font-bold">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Generate Invoice
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-card border-white/10 backdrop-blur-xl">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold italic">Monthly Invoice</DialogTitle>
                                <DialogDescription>
                                    Aggregate all transactions for a specific period into a professional invoice.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-5 py-6">
                                <div className="space-y-2">
                                    <Label>Select Customers</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            onValueChange={(val) => {
                                                const customer = customers.find(c => c.id.toString() === val);
                                                if (customer && !selectedCustomers.some(c => c.id === customer.id)) {
                                                    setSelectedCustomers([...selectedCustomers, customer]);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 text-white flex-1">
                                                <SelectValue placeholder="Add customer..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-white/10 text-white">
                                                {customers.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {selectedCustomers.map(cust => (
                                            <Badge key={cust.id} variant="secondary" className="gap-1 bg-primary/20 text-primary border-primary/20">
                                                {cust.name}
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCustomers(selectedCustomers.filter(c => c.id !== cust.id))}
                                                    className="hover:text-white"
                                                >
                                                    <PlusCircle className="h-3 w-3 rotate-45" />
                                                </button>
                                            </Badge>
                                        ))}
                                        {selectedCustomers.length === 0 && (
                                            <p className="text-xs text-muted-foreground italic">No customers selected</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Months to Include</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-primary"
                                            onClick={() => {
                                                const now = new Date();
                                                const m = (now.getMonth() + 1).toString();
                                                const y = now.getFullYear().toString();
                                                if (!selectedPeriods.some(p => p.month === m && p.year === y)) {
                                                    setSelectedPeriods([...selectedPeriods, { month: m, year: y }]);
                                                }
                                            }}
                                        >
                                            <PlusCircle className="mr-1 h-3 w-3" /> Add Period
                                        </Button>
                                    </div>

                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedPeriods.map((period, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-white/5 p-3 rounded-lg border border-white/10 animate-in slide-in-from-right-2 duration-300 group hover:border-primary/30 transition-colors">
                                                <div className="flex-1 grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase text-muted-foreground">Month</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="12"
                                                            placeholder="MM"
                                                            value={period.month}
                                                            onChange={(e) => {
                                                                const newPeriods = [...selectedPeriods];
                                                                newPeriods[idx].month = e.target.value;
                                                                setSelectedPeriods(newPeriods);
                                                            }}
                                                            className="bg-black/30 border-white/10 h-9 text-sm text-white focus:border-primary/50"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase text-muted-foreground">Year</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="YYYY"
                                                            value={period.year}
                                                            onChange={(e) => {
                                                                const newPeriods = [...selectedPeriods];
                                                                newPeriods[idx].year = e.target.value;
                                                                setSelectedPeriods(newPeriods);
                                                            }}
                                                            className="bg-black/30 border-white/10 h-9 text-sm text-white focus:border-primary/50"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 mt-5"
                                                    onClick={() => setSelectedPeriods(selectedPeriods.filter((_, i) => i !== idx))}
                                                >
                                                    <PlusCircle className="h-4 w-4 rotate-45" />
                                                </Button>
                                            </div>
                                        ))}
                                        {selectedPeriods.length === 0 && (
                                            <div className="text-center py-8 border border-dashed border-white/10 rounded-lg text-muted-foreground text-sm">
                                                No periods added. Click 'Add Period' to start.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-end">
                                    <Button type="button" variant="ghost" onClick={() => setIsGenerateOpen(false)} className="sm:mr-auto text-white">Cancel</Button>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="font-bold border-primary text-primary hover:bg-primary hover:text-black shadow-lg shadow-primary/5"
                                            onClick={handleExportMultiMonth}
                                            disabled={selectedPeriods.length === 0 || selectedCustomers.length === 0}
                                        >
                                            <Download className="mr-2 h-4 w-4" /> Export Report
                                        </Button>
                                        <Button type="submit" className="font-bold shadow-lg shadow-primary/20" disabled={selectedPeriods.length === 0 || selectedCustomers.length === 0}>
                                            Generate Final Invoices
                                        </Button>
                                    </div>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-card/40 backdrop-blur-sm border-white/10 shadow-xl overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/5 py-4 px-6">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by invoice # or customer..."
                            className="pl-10 bg-black/20 border-white/10 h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="py-4 font-bold">INVOICE #</TableHead>
                                <TableHead className="font-bold">CUSTOMER</TableHead>
                                <TableHead className="font-bold text-center">TAX PERIOD</TableHead>
                                <TableHead className="font-bold text-right">TOTAL AMOUNT</TableHead>
                                <TableHead className="font-bold text-center">STATUS</TableHead>
                                <TableHead className="text-right pr-6 font-bold">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <TableRow key={i} className="border-white/5">
                                        {Array(6).fill(0).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">
                                        No invoices found. Generate your first invoice to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <TableRow key={inv.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="font-mono font-bold text-primary group-hover:scale-105 transition-transform origin-left">
                                            {inv.invoice_number}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold ring-1 ring-primary/20">
                                                    {inv.customer?.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold">{inv.customer?.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {new Date(inv.year, inv.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="text-right font-black tracking-tight text-lg">
                                            ${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(inv.status)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 px-4 border-white/10 hover:bg-primary hover:text-white transition-all shadow-sm"
                                                onClick={() => viewInvoice(inv.id)}
                                            >
                                                <Eye className="mr-2 h-3.5 w-3.5" />
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-[#fafafa] text-zinc-950 p-0 overflow-hidden border-none shadow-2xl">
                    {selectedInvoice && (
                        <div className="flex flex-col h-full bg-white">
                            {/* Invoice Header / Ribbon */}
                            <div className="bg-zinc-900 text-white p-8 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
                                            <FileText size={24} />
                                        </div>
                                        <h2 className="text-2xl font-black italic tracking-tighter">InvoiceFlow</h2>
                                    </div>
                                    <h1 className="text-5xl font-black tracking-tighter uppercase opacity-40">Invoice</h1>
                                </div>
                                <div className="text-right space-y-2">
                                    <div className="inline-block rounded-md border border-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest bg-white/5">
                                        {selectedInvoice.status}
                                    </div>
                                    <p className="text-sm font-medium opacity-60">#{selectedInvoice.invoice_number}</p>
                                    <p className="text-sm font-medium opacity-60">Date: {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Billing Info */}
                            <div className="grid grid-cols-2 gap-12 p-12 border-b border-zinc-100">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-4">From</p>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg text-zinc-900">Your Business Name</h3>
                                        <p className="text-sm text-zinc-600">billing@invoiceflow.io</p>
                                        <p className="text-sm text-zinc-600">123 Business Street, Suite 100</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-4">Bill To</p>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg text-zinc-900">{selectedInvoice.customer?.name}</h3>
                                        <p className="text-sm text-zinc-600">{selectedInvoice.customer?.email}</p>
                                        <p className="text-sm text-zinc-600">{selectedInvoice.customer?.address || 'No address provided'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="p-12 pb-6">
                                <Table>
                                    <TableHeader className="bg-zinc-50 border-y border-zinc-100">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-zinc-600 font-bold py-4">Item & Description</TableHead>
                                            <TableHead className="text-zinc-600 font-bold text-center">Qty</TableHead>
                                            <TableHead className="text-zinc-600 font-bold text-right">Rate</TableHead>
                                            <TableHead className="text-zinc-600 font-bold text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedInvoice.line_items?.map((item, idx) => (
                                            <TableRow key={idx} className="border-b border-zinc-50 hover:bg-transparent">
                                                <TableCell className="py-6">
                                                    <p className="font-bold text-zinc-900">{item.item_name}</p>
                                                    <p className="text-xs text-zinc-500 mt-1">Service delivered between {selectedInvoice.month}/{selectedInvoice.year}</p>
                                                </TableCell>
                                                <TableCell className="text-center font-medium text-zinc-600">{item.quantity}</TableCell>
                                                <TableCell className="text-right text-zinc-600">${item.unit_price.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-bold text-zinc-900">${item.total.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Summary */}
                            <div className="flex justify-end p-12 pt-0">
                                <div className="w-64 space-y-4">
                                    <div className="flex justify-between text-sm text-zinc-500">
                                        <span>Subtotal</span>
                                        <span>${selectedInvoice.total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-zinc-500 pb-4 border-b border-zinc-100">
                                        <span>Tax (0%)</span>
                                        <span>$0.00</span>
                                    </div>
                                    <div className="flex justify-between text-2xl font-black text-primary">
                                        <span>Total</span>
                                        <span>${selectedInvoice.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer / Actions */}
                            <div className="flex items-center justify-between p-8 bg-zinc-50 border-t border-zinc-100">
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                                        <Download className="mr-2 h-4 w-4" />
                                        PDF
                                    </Button>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    {selectedInvoice.status !== 'approved' && selectedInvoice.status !== 'paid' && (
                                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14A7 7 0 0012 5z" /></svg>
                                            Awaiting customer approval before export
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <Button variant="outline" className="border-zinc-200 text-zinc-600 hover:bg-white" onClick={() => setIsDetailOpen(false)}>Close</Button>
                                        {selectedInvoice.status === 'draft' && (
                                            <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold" onClick={() => updateStatus(selectedInvoice.id, 'sent')}>
                                                <Send className="mr-2 h-4 w-4" /> Mark as Sent
                                            </Button>
                                        )}
                                        {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'approved') && (
                                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold" onClick={() => updateStatus(selectedInvoice.id, 'paid')}>
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Paid
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
