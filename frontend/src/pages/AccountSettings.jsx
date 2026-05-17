import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '../context/AuthContext';
import { Building2, Loader2, Save, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountSettings() {
    const { user, updateAccount } = useAuth();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        business_name: '',
        current_password: '',
        new_password: '',
    });

    useEffect(() => {
        setFormData((current) => ({
            ...current,
            name: user?.name || '',
            email: user?.email || '',
            business_name: user?.business_name || '',
        }));
    }, [user]);

    const handleChange = (field, value) => {
        setFormData((current) => ({ ...current, [field]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);

        try {
            await updateAccount({
                name: formData.name,
                email: formData.email,
                business_name: formData.business_name,
                current_password: formData.current_password,
                new_password: formData.new_password,
            });
            setFormData((current) => ({
                ...current,
                current_password: '',
                new_password: '',
            }));
            toast.success('Account settings updated');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update account settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight gradient-text">Account Settings</h1>
                <p className="text-muted-foreground text-lg">Keep your profile, login, and business details current.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <Card className="bg-card/40 backdrop-blur-sm border-white/10 shadow-xl">
                    <CardHeader className="border-b border-white/5">
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <UserRound className="h-5 w-5 text-primary" />
                            Profile
                        </CardTitle>
                        <CardDescription>Your name and email are used for sign-in and activity records.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-5 pt-6">
                        <div className="grid gap-2">
                            <Label htmlFor="account-name">Full Name</Label>
                            <Input
                                id="account-name"
                                value={formData.name}
                                maxLength={120}
                                onChange={(event) => handleChange('name', event.target.value)}
                                className="bg-white/5 border-white/10"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="account-email">Email Address</Label>
                            <Input
                                id="account-email"
                                type="email"
                                value={formData.email}
                                maxLength={254}
                                onChange={(event) => handleChange('email', event.target.value)}
                                className="bg-white/5 border-white/10"
                                required
                            />
                        </div>

                        {user?.role === 'admin' && (
                            <div className="grid gap-2">
                                <Label htmlFor="business-name">Business Name</Label>
                                <Input
                                    id="business-name"
                                    value={formData.business_name}
                                    maxLength={150}
                                    onChange={(event) => handleChange('business_name', event.target.value)}
                                    className="bg-white/5 border-white/10"
                                    required
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-card/40 backdrop-blur-sm border-white/10 shadow-xl">
                        <CardHeader className="border-b border-white/5">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Password
                            </CardTitle>
                            <CardDescription>Enter your current password only when setting a new one.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 pt-6">
                            <div className="grid gap-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={formData.current_password}
                                    onChange={(event) => handleChange('current_password', event.target.value)}
                                    className="bg-white/5 border-white/10"
                                    autoComplete="current-password"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={formData.new_password}
                                    minLength={6}
                                    maxLength={72}
                                    onChange={(event) => handleChange('new_password', event.target.value)}
                                    className="bg-white/5 border-white/10"
                                    autoComplete="new-password"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 backdrop-blur-sm border-white/10 shadow-xl">
                        <CardContent className="pt-6">
                            <div className="mb-5 flex items-center gap-3 text-sm text-muted-foreground">
                                <Building2 className="h-4 w-4 text-primary" />
                                <span>{user?.business_name || user?.role}</span>
                            </div>
                            <Button type="submit" className="w-full h-11 font-bold" disabled={saving}>
                                {saving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}
