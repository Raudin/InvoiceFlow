import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import AppNavbar from '../components/Navbar';
import api from '../api/client';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, UserPlus, Copy, KeyRound, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
    const [editingId, setEditingId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [portalCreds, setPortalCreds] = useState(null); // { email, password }
    const [copiedField, setCopiedField] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data.data);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/customers/${editingId}`, formData);
                fetchCustomers();
                handleClose();
            } else {
                const res = await api.post('/customers', formData);
                fetchCustomers();
                handleClose();
                // Show portal credentials if returned
                if (res.data.data?.portal_email) {
                    setPortalCreds({
                        email: res.data.data.portal_email,
                        password: res.data.data.portal_password,
                    });
                }
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save customer');
        }
    };

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleEdit = (customer) => {
        setFormData({ name: customer.name, email: customer.email, phone: customer.phone, address: customer.address });
        setEditingId(customer.id);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            await api.delete(`/customers/${id}`);
            fetchCustomers();
        }
    };

    const handleClose = () => {
        setFormData({ name: '', email: '', phone: '', address: '' });
        setEditingId(null);
        setIsDialogOpen(false);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight gradient-text">Customers</h1>
                    <p className="text-muted-foreground text-lg">Manage your business contacts and billing information.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-primary/20 h-11 px-6 font-bold" onClick={() => { setEditingId(null); setFormData({ name: '', email: '', phone: '', address: '' }); }}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-card border-white/10 backdrop-blur-xl">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">{editingId ? 'Edit' : 'Add New'} Customer</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below to {editingId ? 'update' : 'create'} a customer.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Billing Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                                <Button type="submit" className="font-bold">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-card/40 backdrop-blur-sm border-white/10 shadow-xl overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/5 py-4 px-6 space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customers..."
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
                                <TableHead className="w-[300px] font-bold py-4">CUSTOMER</TableHead>
                                <TableHead className="font-bold">CONTACT INFO</TableHead>
                                <TableHead className="font-bold">ADDRESS</TableHead>
                                <TableHead className="text-right font-bold pr-6">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <TableRow key={i} className="border-white/5">
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        No customers found. Try a different search term or add a new customer.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <TableRow key={customer.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-lg">{customer.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center text-sm text-muted-foreground gap-2">
                                                    <Mail className="h-3 w-3" />
                                                    {customer.email || 'No email'}
                                                </div>
                                                <div className="flex items-center text-sm text-muted-foreground gap-2">
                                                    <Phone className="h-3 w-3" />
                                                    {customer.phone || 'No phone'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                <span className="truncate max-w-[200px]">{customer.address || 'No address'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(customer)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(customer.id)}>
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

            {/* Portal Credentials Dialog */}
            <Dialog open={!!portalCreds} onOpenChange={() => setPortalCreds(null)}>
                <DialogContent className="sm:max-w-[460px] bg-card border-white/10 backdrop-blur-xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <KeyRound className="w-5 h-5 text-emerald-400" />
                            </div>
                            <DialogTitle className="text-xl font-bold">Portal Account Created</DialogTitle>
                        </div>
                        <DialogDescription>
                            Share these credentials with the customer so they can log in to their portal and approve invoices.
                            <span className="block mt-1 text-amber-400 text-xs font-semibold">⚠ This password will not be shown again.</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Portal Email</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={portalCreds?.email || ''}
                                    className="bg-white/5 border-white/10 font-mono text-sm"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => copyToClipboard(portalCreds?.email, 'email')}
                                >
                                    {copiedField === 'email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Portal Password</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={portalCreds?.password || ''}
                                    className="bg-white/5 border-white/10 font-mono text-sm tracking-widest"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => copyToClipboard(portalCreds?.password, 'password')}
                                >
                                    {copiedField === 'password' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setPortalCreds(null)} className="w-full font-bold">
                            Done – I've saved the credentials
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
