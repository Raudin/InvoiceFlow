import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, ArrowLeft, Mail, Loader2 } from 'lucide-react';
import api from '../api/client';
import { toast } from 'sonner';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
            toast.success('Reset link sent if email exists');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500 relative">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-2xl shadow-primary/20 mb-4 transform hover:rotate-6 transition-transform">
                        <FileText size={32} />
                    </div>
                    <h1 className="text-3xl font-black italic gradient-text">InvoiceFlow</h1>
                    <p className="text-muted-foreground font-bold tracking-widest text-xs uppercase mt-2">Business Suite</p>
                </div>

                <Card className="border-white/10 bg-card/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                        <CardDescription>
                            Enter your email and we'll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {submitted ? (
                            <div className="text-center py-6 space-y-4">
                                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold">Check your email</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    If an account exists for <span className="text-foreground font-bold">{email}</span>,
                                    you will receive instructions on how to reset your password shortly.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        className="bg-white/5 border-white/10 h-12 focus:ring-primary"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button className="w-full h-12 font-bold text-lg shadow-lg shadow-primary/20 mt-2" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Send Reset Link'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Link
                            to="/login"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mx-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
