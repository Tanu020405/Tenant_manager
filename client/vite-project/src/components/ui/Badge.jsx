/* Badge — status colors */
const colours = {
    paid: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    overdue: "bg-rose-100 text-rose-700",
    success: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
    active: "bg-sky-100 text-sky-700",
    inactive: "bg-slate-100 text-slate-500",
    occupied: "bg-violet-100 text-violet-700",
    available: "bg-emerald-100 text-emerald-700",
    default: "bg-slate-100 text-slate-600",
};

export const Badge = ({ label }) => {
    const key = (label || "default").toLowerCase();
    const cls = colours[key] || colours.default;
    return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
            {label}
        </span>
    );
};
