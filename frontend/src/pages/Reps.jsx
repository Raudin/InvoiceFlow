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
import { Switch } from "@/components/ui/switch";
import api from '../api/client';
import { Plus, Search, Edit2, Trash2, Mail, UserPlus, Shield, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Reps() {
    const [reps, setReps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [editingId, setEditingId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchReps();
    }, []);

    const fetchReps = async () => {
        try {
            const response = await api.get('/reps');
            setReps(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch representatives');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/reps/${editingId}`, formData);
                toast.success('Representative updated');
            } else {
                await api.post('/reps', formData);
                toast.success('Representative created');
            }
            fetchReps();
            handleClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save representative');
        }
    };

    const handleEdit = (rep) => {
        setFormData({ name: rep.name, email: rep.email, password: '' });
        setEditingId(rep.id);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this representative?')) {
            try {
                await api.delete(`/reps/${id}`);
                toast.success('Representative deleted');
                fetchReps();
            } catch (error) {
                toast.error('Failed to delete representative');
            }
        }
    };

    const handleToggleStatus = async (rep) => {
        try {
            await api.patch(`/reps/${rep.id}/toggle`, { is_active: !rep.is_active });
            toast.success(`Representative ${!rep.is_active ? 'activated' : 'deactivated'}`);
            fetchReps();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleClose = () => {
        setFormData({ name: '', email: '', password: '' });
        setEditingId(null);
        setIsDialogOpen(false);
    };

    const filteredReps = reps.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight gradient-text">Representatives</h1>
                    <p className="text-muted-foreground text-lg">Manage your field agents and their access.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="shadow-lg shadow-primary/20 h-11 px-6 font-bold" onClick={() => { setEditingId(null); setFormData({ name: '', email: '', password: '' }); }}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Representative
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-card border-white/10 backdrop-blur-xl">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">{editingId ? 'Edit' : 'Add New'} Representative</DialogTitle>
                                <DialogDescription>
                                    Create or update a field representative account.
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
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password {editingId && '(leave blank to keep current)'}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                        required={!editingId}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
                                <Button type="submit" className="font-bold">Save Representative</Button>
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
                            placeholder="Search reps..."
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
                                <TableHead className="w-[300px] font-bold py-4">REPRESENTATIVE</TableHead>
                                <TableHead className="font-bold">EMAIL</TableHead>
                                <TableHead className="font-bold">STATUS</TableHead>
                                <TableHead className="text-right font-bold pr-6">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <TableRow key={i} className="border-white/5">
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredReps.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        No representatives found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReps.map((rep) => (
                                    <TableRow key={rep.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${rep.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    {rep.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-lg">{rep.name}</span>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Shield className="h-3 w-3" />
                                                        Representative
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                                                <Mail className="h-3 w-3" />
                                                {rep.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={rep.is_active}
                                                    onCheckedChange={() => handleToggleStatus(rep)}
                                                />
                                                <span className={`text-xs font-medium ${rep.is_active ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {rep.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(rep)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(rep.id)}>
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
