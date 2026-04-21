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
import api from '../../api/client';
import { PlusCircle, Search, Trash2, Calendar, User, Hash, X, Eye, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { isBefore, addHours } from 'date-fns';

export default function RepTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingTx, setEditingTx] = useState(null);

    // Form state for batch transaction
    const [formData, setFormData] = useState({
        customer_id: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ item_id: '', quantity: '1', key: Date.now() }]
    });

    const [editFormData, setEditFormData] = useState({
        quantity: 1,
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [txRes, custRes, itemRes] = await Promise.all([
                api.get('/rep/transactions'),
                api.get('/rep/customers'),
                api.get('/rep/items')
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
            const validItems = formData.items.filter(i => i.item_id && i.quantity > 0);
            if (validItems.length === 0) {
                toast.error('Please add at least one valid item');
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

            await api.post('/rep/transactions', data);
            toast.success('Transactions recorded');
            fetchData();
            handleClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save transactions');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/rep/transactions/${editingTx.id}`, {
                quantity: parseInt(editFormData.quantity),
                notes: editFormData.notes
            });
            toast.success('Transaction updated');
            fetchData();
            setIsEditDialogOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update transaction');
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this transaction record?')) {
            try {
                await api.delete(`/rep/transactions/${id}`);
                toast.success('Transaction deleted');
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete transaction');
            }
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

    const canModify = (createdAt) => {
        return isBefore(new Date(), addHours(new Date(createdAt), 24));
    };

    const groupedTransactions = transactions.reduce((acc, tx) => {
        const dateKey = new Date(tx.date).toISOString().split('T')[0];
        const key = `${dateKey}_${tx.customer_id}`;
        if (!acc[key]) {
            acc[key] = {
                id: key,
                date: tx.date,
                customer: tx.customer,
                itemsCount: 0,
                transactions: []
            };
        }
        acc[key].itemsCount += 1;
        acc[key].transactions.push(tx);
        return acc;
    }, {});

    const groupedList = Object.values(groupedTransactions).sort((a, b) => new Date(b.date) - new Date(a.date));
    const filteredGroups = groupedList.filter(group =>
        group.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.transactions.some(t => t.item?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight gradient-text">My Transactions</h1>
                    <p className="text-muted-foreground text-lg">Manage transactions you've recorded.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-primary/20 h-11 px-6 font-bold">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Record Transaction
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] bg-card border-white/10 backdrop-blur-xl">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">New Transaction Record</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6 py-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Customer</Label>
                                        <Select value={formData.customer_id.toString()} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                                            <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select customer" /></SelectTrigger>
                                            <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="bg-white/5 border-white/10" required />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label>Items</Label>
                                    <div className="space-y-3">
                                        {formData.items.map((row, idx) => (
                                            <div key={row.key} className="flex gap-3">
                                                <div className="flex-1">
                                                    <Select value={row.item_id.toString()} onValueChange={(v) => handleItemChange(idx, 'item_id', v)}>
                                                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select Item" /></SelectTrigger>
                                                        <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="w-24">
                                                    <Input type="number" min="1" value={row.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} className="bg-white/5 border-white/10" required />
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItemRow(idx)} disabled={formData.items.length === 1}><X className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddItemRow} className="w-full border-dashed">Add Item</Button>
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-white/5 border-white/10" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                                <Button type="submit">Record</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-card/40 backdrop-blur-sm border-white/10 shadow-xl overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/5 py-4 px-6">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search..." className="pl-10 bg-black/20 border-white/10 h-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/5">
                                <TableHead className="py-4 font-bold"><Calendar className="inline mr-2 w-4 h-4" />DATE</TableHead>
                                <TableHead className="font-bold"><User className="inline mr-2 w-4 h-4" />CUSTOMER</TableHead>
                                <TableHead className="font-bold text-center"><Hash className="inline mr-2 w-4 h-4" />ITEMS</TableHead>
                                <TableHead className="text-right pr-6 font-bold">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredGroups.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No records found.</TableCell></TableRow>
                            ) : (
                                filteredGroups.map((group) => (
                                    <TableRow key={group.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell>{new Date(group.date).toLocaleDateString()}</TableCell>
                                        <TableCell><span className="font-semibold">{group.customer?.name}</span></TableCell>
                                        <TableCell className="text-center"><Badge variant="secondary">{group.itemsCount} items</Badge></TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary"><Eye className="h-4 w-4" /></Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl bg-card border-white/10">
                                                    <DialogHeader><DialogTitle>Group Details</DialogTitle></DialogHeader>
                                                    <Table>
                                                        <TableHeader><TableRow className="border-white/10"><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                                        <TableBody>
                                                            {group.transactions.map(tx => (
                                                                <TableRow key={tx.id} className="border-white/5">
                                                                    <TableCell>{tx.item?.name}</TableCell>
                                                                    <TableCell className="text-right">{tx.quantity}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex justify-end gap-1">
                                                                            {canModify(tx.created_at) && (
                                                                                <>
                                                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                                                                        setEditingTx(tx);
                                                                                        setEditFormData({ quantity: tx.quantity, notes: tx.notes });
                                                                                        setIsEditDialogOpen(true);
                                                                                    }}>
                                                                                        <Edit2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDelete(tx.id)}>
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
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

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input type="number" min="1" value={editFormData.quantity} onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })} className="bg-white/5 border-white/10" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Input value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} className="bg-white/5 border-white/10" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
