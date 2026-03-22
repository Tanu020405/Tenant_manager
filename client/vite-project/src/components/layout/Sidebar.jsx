import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { clearStoredTheme } from "../../utils/theme.js";

const tenantLinks = [
    { to: "/properties", icon: "🏠", label: "Properties" },
    { to: "/renters", icon: "👥", label: "Renters" },
    { to: "/invoices", icon: "🧾", label: "Invoices" },
    { to: "/payments", icon: "💳", label: "Payments" },
    { to: "/analytics", icon: "📊", label: "Analytics" },
];

const renterLinks = [
    { to: "/my-invoices", icon: "🧾", label: "My Invoices" },
    { to: "/my-payments", icon: "💳", label: "My Payments" },
];

export const Sidebar = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const links = role === "renter" ? renterLinks : tenantLinks;

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        clearStoredTheme();
        navigate("/login");
    };

    return (
        <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-slate-200/70 bg-[color:var(--color-surface)]">
            {/* Brand */}
            <div className="border-b border-slate-200/70 px-5 py-5 flex items-center gap-3">
                {user?.tenant?.assets?.logoUrl ? (
                    <img 
                        src={user.tenant.assets.logoUrl} 
                        alt="Logo" 
                        className="h-8 w-8 rounded object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                    />
                ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[color:var(--color-primary)] text-sm font-bold text-white">
                        {user?.tenant?.name?.charAt(0) || user?.tenantId?.charAt(0) || "W"}
                    </div>
                )}
                <div className="overflow-hidden">
                    <p className="truncate text-[10px] uppercase tracking-widest text-[color:var(--color-muted)]">Workspace</p>
                    <p className="truncate text-sm font-bold text-[color:var(--color-primary)]">
                        {user?.tenant?.name || user?.tenantId || "—"}
                    </p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                {links.map(({ to, icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive
                                ? "bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]"
                                : "text-[color:var(--color-muted)] hover:bg-slate-100 hover:text-[color:var(--color-text)]"
                            }`
                        }
                    >
                        <span className="text-base">{icon}</span>
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* User + logout */}
            <div className="border-t border-slate-200/70 px-4 py-4">
                <p className="truncate text-xs font-semibold text-[color:var(--color-text)]">{user?.name}</p>
                <p className="truncate text-[10px] capitalize text-[color:var(--color-muted)]">{role}</p>
                <button
                    onClick={handleLogout}
                    className="mt-3 w-full rounded-xl border border-slate-200 py-1.5 text-xs font-semibold text-[color:var(--color-muted)] transition hover:bg-slate-50 hover:text-rose-500"
                >
                    Sign out
                </button>
            </div>
        </aside>
    );
};
