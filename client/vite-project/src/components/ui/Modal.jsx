import { useEffect } from "react";

export const Modal = ({ open, onClose, title, children, width = "max-w-lg" }) => {
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        if (open) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            {/* panel */}
            <div className={`relative z-10 w-full ${width} rounded-2xl bg-[color:var(--color-surface)] shadow-xl`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h3 className="text-base font-semibold text-[color:var(--color-primary)]">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-[color:var(--color-muted)] transition hover:bg-slate-100"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
};
