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
import AppNavbar from '../components/Navbar';
import api from '../api/client';
import { PlusCircle, Search, Trash2, Calendar, User, Package, Hash, DollarSign, ArrowRightLeft } from 'lucide-react';

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ customer_id: '', item_id: '', quantity: '', date: new Date().toISOString().split('T')[0], notes: '' });
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                customer_id: parseInt(formData.customer_id),
                item_id: parseInt(formData.item_id),
                quantity: parseInt(formData.quantity),
                date: new Date(formData.date).toISOString()
            };
            await api.post('/transactions', data);
            fetchData();
            handleClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save transaction');
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this transaction record?')) {
            await api.delete(`/transactions/${id}`);
            fetchData();
        }
    };

    const handleClose = () => {
        setFormData({ customer_id: '', item_id: '', quantity: '', date: new Date().toISOString().split('T')[0], notes: '' });
        setIsDialogOpen(false);
    };

    const filteredTransactions = transactions.filter(tx =>
        tx.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.item?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                                    {Array(7).fill(0).map((_, j) => (
                                        <TableHead key={j}><Skeleton className="h-4 w-full" /></TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <TableRow key={i} className="border-white/5">
                                        {Array(7).fill(0).map((_, j) => (
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
                    <DialogContent className="sm:max-w-[480px] bg-card border-white/10 backdrop-blur-xl">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">New Transaction</DialogTitle>
                                <DialogDescription>
                                    Log a new sale or service provided to a customer.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-5 py-6">
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
                                    <Label>Item / Service</Label>
                                    <Select
                                        value={formData.item_id.toString()}
                                        onValueChange={(value) => setFormData({ ...formData, item_id: value })}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue placeholder="Select an item" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            {items.map((i) => (
                                                <SelectItem key={i.id} value={i.id.toString()}>{i.name} (${i.unit_price})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity">Quantity</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            min="1"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                            className="bg-white/5 border-white/10"
                                            required
                                        />
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
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Input
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                                <Button type="submit" className="font-bold">Record Transaction</Button>
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
                                <TableHead className="font-bold"><Package className="inline mr-2 w-4 h-4" />ITEM</TableHead>
                                <TableHead className="font-bold"><Hash className="inline mr-2 w-4 h-4" />QTY</TableHead>
                                <TableHead className="font-bold"><DollarSign className="inline mr-2 w-4 h-4" />PRICE</TableHead>
                                <TableHead className="font-bold"><ArrowRightLeft className="inline mr-2 w-4 h-4" />TOTAL</TableHead>
                                <TableHead className="text-right pr-6 font-bold">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <TableRow key={i} className="border-white/5">
                                        {Array(7).fill(0).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <TableRow key={tx.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="font-medium">
                                            {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-500 font-bold border border-blue-500/20">
                                                    {tx.customer?.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold">{tx.customer?.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium">
                                                {tx.item?.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-muted-foreground">{tx.quantity}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground">${tx.unit_price.toFixed(2)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-foreground">${(tx.quantity * tx.unit_price).toFixed(2)}</span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => handleDelete(tx.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
