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
import { PlusCircle, Search, Trash2, Calendar, User, Package, Hash, DollarSign, ArrowRightLeft, X, Eye } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form state for batch transaction
    const [formData, setFormData] = useState({
        customer_id: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ item_id: '', quantity: '1', key: Date.now() }]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [txRes, custRes, itemRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/customers'),
                api.get('/items')
            ]);
            setTransactions(txRes.data.data);
            setCustomers(custRes.data.data);
            setItems(itemRes.data.data);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItemRow = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { item_id: '', quantity: '1', key: Date.now() }]
        }));
    };

    const handleRemoveItemRow = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Filter out empty rows
            const validItems = formData.items.filter(i => i.item_id && i.quantity > 0);

            if (validItems.length === 0) {
                alert('Please add at least one valid item');
                return;
            }

            const data = {
                customer_id: parseInt(formData.customer_id),
                date: new Date(formData.date).toISOString(),
                notes: formData.notes,
                items: validItems.map(i => ({
                    item_id: parseInt(i.item_id),
                    quantity: parseInt(i.quantity)
                }))
            };

            await api.post('/transactions', data);
            fetchData();
            handleClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save transactions');
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this transaction record?')) {
            await api.delete(`/transactions/${id}`);
            fetchData();
        }
    };

    const handleClose = () => {
        setFormData({
            customer_id: '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
            items: [{ item_id: '', quantity: '1', key: Date.now() }]
        });
        setIsDialogOpen(false);
    };

    // Group transactions by Date and Customer for the main view
    const groupedTransactions = transactions.reduce((acc, tx) => {
        const dateKey = new Date(tx.date).toISOString().split('T')[0];
        const key = `${dateKey}_${tx.customer_id}`;

        if (!acc[key]) {
            acc[key] = {
                id: key, // Virtual ID for the group
                date: tx.date,
                customer: tx.customer,
                itemsCount: 0,
                totalAmount: 0,
                transactions: []
            };
        }

        acc[key].itemsCount += 1;
        acc[key].totalAmount += (tx.quantity * tx.unit_price);
        acc[key].transactions.push(tx);

        return acc;
    }, {});

    const groupedList = Object.values(groupedTransactions).sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    const filteredGroups = groupedList.filter(group =>
        group.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.transactions.some(t => t.item?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-11 w-48" />
                </div>
                <Card className="bg-card/40 backdrop-blur-sm border-white/10 shadow-xl overflow-hidden">
                    <div className="p-0">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="hover:bg-transparent border-white/5">
                                    {Array(6).fill(0).map((_, j) => (
                                        <TableHead key={j}><Skeleton className="h-4 w-full" /></TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i} className="border-white/5">
                                        {Array(6).fill(0).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight gradient-text">Transactions</h1>
                    <p className="text-muted-foreground text-lg">Record and monitor daily business activity.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-primary/20 h-11 px-6 font-bold">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Record Transaction
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] bg-card border-white/10 backdrop-blur-xl max-h-[85vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">New Transaction Record</DialogTitle>
                                <DialogDescription>
                                    Log transactions for a customer on a specific date.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-6">
                                {/* Header Section: Customer & Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Customer</Label>
                                        <Select
                                            value={formData.customer_id.toString()}
                                            onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Select a customer" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-white/10">
                                                {customers.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="bg-white/5 border-white/10"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div className="space-y-3">
                                    <Label>Items / Services</Label>
                                    <div className="space-y-3">
                                        {formData.items.map((itemRow, index) => (
                                            <div key={itemRow.key} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-300">
                                                <div className="flex-1">
                                                    <Select
                                                        value={itemRow.item_id.toString()}
                                                        onValueChange={(value) => handleItemChange(index, 'item_id', value)}
                                                    >
                                                        <SelectTrigger className="bg-white/5 border-white/10">
                                                            <SelectValue placeholder="Select Item" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-card border-white/10">
                                                            {items.map((i) => (
                                                                <SelectItem key={i.id} value={i.id.toString()}>
                                                                    {i.name} (${i.unit_price})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="w-24">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={itemRow.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        className="bg-white/5 border-white/10"
                                                        placeholder="Qty"
                                                        required
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveItemRow(index)}
                                                    disabled={formData.items.length === 1}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddItemRow}
                                        className="w-full border-dashed border-white/20 hover:border-primary/50 text-muted-foreground hover:text-primary"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Another Item
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Input
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                        placeholder="Overall notes for this record..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                                <Button type="submit" className="font-bold">Record Transactions</Button>
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
                            placeholder="Search transactions..."
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
                                <TableHead className="py-4 font-bold"><Calendar className="inline mr-2 w-4 h-4" />DATE</TableHead>
                                <TableHead className="font-bold"><User className="inline mr-2 w-4 h-4" />CUSTOMER</TableHead>
                                <TableHead className="font-bold text-center"><Hash className="inline mr-2 w-4 h-4" />ITEMS</TableHead>
                                <TableHead className="font-bold text-right"><DollarSign className="inline mr-2 w-4 h-4" />TOTAL AMOUNT</TableHead>
                                <TableHead className="text-right pr-6 font-bold">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredGroups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No transaction records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredGroups.map((group) => (
                                    <TableRow key={group.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="font-medium">
                                            {new Date(group.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-500 font-bold border border-blue-500/20">
                                                    {group.customer?.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold">{group.customer?.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-white/10 text-foreground">
                                                {group.itemsCount} items
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-foreground">
                                            ${group.totalAmount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10 mr-1">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl bg-card border-white/10">
                                                    <DialogHeader>
                                                        <DialogTitle>Transaction Details</DialogTitle>
                                                        <DialogDescription>
                                                            {new Date(group.date).toLocaleDateString()} - {group.customer?.name}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="mt-4">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="border-white/10">
                                                                    <TableHead>Item</TableHead>
                                                                    <TableHead className="text-right">Qty</TableHead>
                                                                    <TableHead className="text-right">Price</TableHead>
                                                                    <TableHead className="text-right">Total</TableHead>
                                                                    <TableHead></TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {group.transactions.map(tx => (
                                                                    <TableRow key={tx.id} className="border-white/5">
                                                                        <TableCell>{tx.item?.name}</TableCell>
                                                                        <TableCell className="text-right">{tx.quantity}</TableCell>
                                                                        <TableCell className="text-right">${tx.unit_price.toFixed(2)}</TableCell>
                                                                        <TableCell className="text-right font-bold">${(tx.quantity * tx.unit_price).toFixed(2)}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <Button
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                                                onClick={() => handleDelete(tx.id)}
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
