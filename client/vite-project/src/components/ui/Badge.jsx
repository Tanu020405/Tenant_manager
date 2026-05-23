/* Status Badge with dot indicator & Glass tones */
const colours = {
    paid: { bg: "bg-tertiary-container text-on-tertiary-container", dot: "bg-tertiary" },
    pending: { bg: "bg-primary-container text-on-primary-container", dot: "bg-primary" },
    overdue: { bg: "bg-error-container text-on-error-container", dot: "bg-error" },
    success: { bg: "bg-tertiary-container text-on-tertiary-container", dot: "bg-tertiary" },
    failed: { bg: "bg-error-container text-on-error-container", dot: "bg-error" },
    active: { bg: "bg-tertiary-container text-on-tertiary-container", dot: "bg-tertiary" },
    inactive: { bg: "bg-surface-container-high text-on-surface-variant", dot: "bg-on-surface-variant" },
    occupied: { bg: "bg-secondary-container text-on-secondary-container", dot: "bg-secondary" },
    available: { bg: "bg-tertiary-container text-on-tertiary-container", dot: "bg-tertiary" },
    default: { bg: "bg-surface-container-high text-on-surface-variant", dot: "bg-on-surface-variant" },
};

export const Badge = ({ label }) => {
    const key = (label || "default").toLowerCase();
    const style = colours[key] || colours.default;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${style.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {label}
        </span>
    );
};
