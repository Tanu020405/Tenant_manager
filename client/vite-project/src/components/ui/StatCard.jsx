import { motion } from "framer-motion";

export const StatCard = ({ icon, label, value, sub, color = "accent", index = 0 }) => {
    const tone = color === "accent" ? "bg-primary/12 text-primary"
        : color === "success" ? "bg-tertiary/12 text-tertiary"
            : color === "warning" ? "bg-primary/10 text-primary"
                : "bg-error/12 text-error";

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-panel ghost-border p-6 rounded-2xl"
        >
            <div className="flex items-center justify-between">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tone} text-lg`}>
                    {icon}
                </div>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
            <p className="mt-1.5 text-2xl font-bold font-headline text-on-surface">{value}</p>
            {sub && <p className="mt-2 text-xs text-on-surface-variant">{sub}</p>}
        </motion.div>
    );
};
