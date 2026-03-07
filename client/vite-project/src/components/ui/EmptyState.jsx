export const EmptyState = ({ icon = "📭", title, description, action }) => (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
        <span className="text-4xl">{icon}</span>
        <p className="mt-3 text-sm font-semibold text-[color:var(--color-text)]">{title}</p>
        {description && <p className="mt-1 text-xs text-[color:var(--color-muted)]">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
    </div>
);
