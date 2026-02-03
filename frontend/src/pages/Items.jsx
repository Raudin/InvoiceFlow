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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import api from '../api/client';
import { Plus, Search, Edit2, Trash2, Package, Tag, DollarSign, Text } from 'lucide-react';

export default function Items() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ name: '', description: '', unit_price: '' });
    const [editingId, setEditingId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await api.get('/items');
            setItems(response.data.data);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData, unit_price: parseFloat(formData.unit_price) };
            if (editingId) {
                await api.put(`/items/${editingId}`, data);
            } else {
                await api.post('/items', data);
            }
            fetchItems();
            handleClose();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save item');
        }
    };

    const handleEdit = (item) => {
        setFormData({ name: item.name, description: item.description, unit_price: item.unit_price });
        setEditingId(item.id);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            await api.delete(`/items/${id}`);
            fetchItems();
        }
    };

    const handleClose = () => {
        setFormData({ name: '', description: '', unit_price: '' });
        setEditingId(null);
        setIsDialogOpen(false);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight gradient-text">Inventory</h1>
                    <p className="text-muted-foreground text-lg">Manage your products, services, and pricing.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-primary/20 h-11 px-6 font-bold" onClick={() => { setEditingId(null); setFormData({ name: '', description: '', unit_price: '' }); }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-card border-white/10 backdrop-blur-xl">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">{editingId ? 'Edit' : 'Create'} Item</DialogTitle>
                                <DialogDescription>
                                    Define a product or service you offer to your clients.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Item Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-white/5 border-white/10 shadow-inner"
                                        placeholder="e.g. Web Development"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="bg-white/5 border-white/10 shadow-inner"
                                        placeholder="Brief details about the item..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit_price">Unit Price ($)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="unit_price"
                                            type="number"
                                            step="0.01"
                                            value={formData.unit_price}
                                            onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                                            className="pl-10 bg-white/5 border-white/10 shadow-inner"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                                <Button type="submit" className="font-bold">Save Item</Button>
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
                            placeholder="Search items..."
                            className="pl-10 bg-black/20 border-white/10 h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-white/5 font-bold">
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="w-[300px] py-4"><Tag className="inline mr-2 w-4 h-4" />NAME</TableHead>
                                <TableHead><Text className="inline mr-2 w-4 h-4" />DESCRIPTION</TableHead>
                                <TableHead><DollarSign className="inline mr-2 w-4 h-4" />PRICE</TableHead>
                                <TableHead className="text-right pr-6">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <TableRow key={i} className="border-white/5">
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        No items found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item) => (
                                    <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                                                    <Package className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-lg">{item.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground line-clamp-1 max-w-[400px]">
                                                {item.description || "No description provided"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-primary-foreground font-bold text-lg bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                                                ${item.unit_price.toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(item)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
