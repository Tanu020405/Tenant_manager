import { motion } from "framer-motion";

export const EmptyState = ({ icon = "📭", title, description, action }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col items-center justify-center rounded-2xl glass-card py-16 text-center px-8"
    >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary pulse-glow">
            <span className="text-3xl">{icon}</span>
        </div>
        <p className="mt-5 text-base font-semibold font-headline text-on-surface">{title}</p>
        {description && <p className="mt-1.5 max-w-xs text-sm text-on-surface-variant">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
    </motion.div>
);
