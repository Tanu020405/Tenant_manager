import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Modal = ({ open, onClose, title, children, width = "max-w-lg" }) => {
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        if (open) {
            document.addEventListener("keydown", handler);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[6px]"
                        onClick={onClose}
                    />
                    {/* panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={`relative z-10 w-full ${width} glass-card rounded-3xl ring-1 ring-white/20`}
                    >
                        <div className="flex items-center justify-between border-b border-outline-variant/60 px-8 py-5">
                            <h3 className="text-lg font-semibold font-headline text-on-surface">{title}</h3>
                            <button
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
                                aria-label="Close"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-8 py-6">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
