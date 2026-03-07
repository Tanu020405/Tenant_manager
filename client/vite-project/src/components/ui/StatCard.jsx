export const StatCard = ({ icon, label, value, sub, color = "accent" }) => {
    const ring = color === "accent" ? "ring-[color:var(--color-accent)]/20 text-[color:var(--color-accent)]"
        : color === "success" ? "ring-emerald-200 text-emerald-600"
            : color === "warning" ? "ring-amber-200 text-amber-600"
                : "ring-rose-200 text-rose-600";

    return (
        <div className="rounded-2xl border border-slate-200/70 bg-[color:var(--color-surface)] p-6 shadow-sm">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-2 text-xl ${ring}`}>
                {icon}
            </div>
            <p className="mt-4 text-2xl font-bold text-[color:var(--color-primary)]">{value}</p>
            <p className="text-sm font-medium text-[color:var(--color-text)]">{label}</p>
            {sub && <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">{sub}</p>}
        </div>
    );
};
