import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, icon, gradient }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="bg-card/50 backdrop-blur-md border-white/10 overflow-hidden relative group transition-all hover:bg-card/80">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                            <p className={`text-3xl font-bold tracking-tight ${gradient}`}>{value}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${gradient.replace('gradient-text', 'gradient-bg')} bg-opacity-20 shadow-lg`}>
                            {icon}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
