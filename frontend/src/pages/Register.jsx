import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, Building, User, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({
        business_name: '',
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center p-4">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[10%] -right-[15%] w-[60%] h-[60%] bg-primary/15 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[15%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-lg relative"
            >
                <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full scale-75" />

                <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary" />

                    <CardHeader className="text-center pt-10 pb-4">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-6 ring-1 ring-primary/20 shadow-inner">
                            <UserPlus size={32} />
                        </div>
                        <CardTitle className="text-4xl font-black tracking-tight gradient-text">Create Account</CardTitle>
                        <CardDescription className="text-base text-muted-foreground mt-2 px-6">
                            Join thousands of businesses managing their finances with ease.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 py-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="business_name">Business Name</Label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="business_name"
                                            name="business_name"
                                            placeholder="Nexus Corp"
                                            className="pl-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                                            value={formData.business_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="John Doe"
                                            className="pl-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        className="pl-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Min. 6 characters"
                                        className="pl-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2"
                                >
                                    <ShieldCheck className="w-4 h-4 shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20 relative group overflow-hidden"
                                disabled={loading}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Initializing Account...
                                        </>
                                    ) : (
                                        <>
                                            Complete Registration
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pb-10 bg-white/5 border-t border-white/5 mt-4">
                        <p className="text-center text-sm text-muted-foreground mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4">
                                Sign in here
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
