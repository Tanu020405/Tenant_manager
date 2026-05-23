export const Card = ({ children, className = "", glass = true }) => (
    <div
        className={`rounded-2xl ${glass
            ? "glass-panel ghost-border p-6"
            : "border border-outline-variant bg-surface-container-lowest shadow-ambient"} hover:-translate-y-0.5 transition-all duration-300 ${className}`}
    >
        {children}
    </div>
);

export const CardHeader = ({ title, subtitle, action }) => (
    <div className="flex items-start justify-between gap-4 mb-4">
        <div>
            <h2 className="text-xl font-semibold font-headline text-on-surface">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);

export const CardBody = ({ children, className = "" }) => (
    <div className={`${className}`}>{children}</div>
);
