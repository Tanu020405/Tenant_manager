export const Card = ({ children, className = "" }) => (
    <div className={`rounded-2xl border border-slate-200/70 bg-[color:var(--color-surface)] shadow-sm ${className}`}>
        {children}
    </div>
);

export const CardHeader = ({ title, subtitle, action }) => (
    <div className="flex items-start justify-between gap-4 p-6 pb-0">
        <div>
            <h2 className="text-lg font-semibold text-[color:var(--color-primary)]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-[color:var(--color-muted)]">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);

export const CardBody = ({ children, className = "" }) => (
    <div className={`p-6 ${className}`}>{children}</div>
);
