import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { clearStoredTheme } from "../../utils/theme.js";
import { motion, AnimatePresence } from "framer-motion";

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

export const Sidebar = ({ isOpen, onClose }) => {
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
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Sidebar */}
                    <motion.aside
                        initial={{ x: -300, opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 28
                        }}
                        className="fixed top-0 left-0 z-50 h-screen w-64 glass-card flex flex-col"
                    >
                        {/* Brand */}
                        <div className="border-b border-outline-variant/60 px-6 py-6 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-sm font-bold text-on-primary shadow-sm">
                                {user?.tenant?.name?.charAt(0)?.toUpperCase() || "W"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">Organization</p>
                                <p className="truncate text-sm font-semibold text-on-surface">
                                    {user?.tenant?.name || "—"}
                                </p>
                            </div>
                        </div>

                        {/* Nav with stagger */}
                        <motion.nav
                            className="flex-1 px-3 py-5 space-y-1"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: {
                                    transition: {
                                        staggerChildren: 0.06
                                    }
                                }
                            }}
                        >
                            {links.map(({ to, icon, label }) => (
                                <motion.div
                                    key={to}
                                    variants={{
                                        hidden: { opacity: 0, x: -12 },
                                        visible: { opacity: 1, x: 0 }
                                    }}
                                >
                                    <NavLink
                                        to={to}
                                        className={({ isActive }) =>
                                            `group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                                                isActive
                                                    ? "bg-primary/10 text-primary font-semibold"
                                                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60"
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="sidebar-active-indicator"
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary"
                                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                    />
                                                )}
                                                <span className="text-base">{icon}</span>
                                                <span>{label}</span>
                                            </>
                                        )}
                                    </NavLink>
                                </motion.div>
                            ))}
                        </motion.nav>

                        {/* Footer */}
                        <div className="border-t border-outline-variant/60 px-4 py-4">
                            <div className="flex items-center gap-3 px-2 mb-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary-container/30 text-xs font-bold text-primary">
                                    {(user?.name || "U").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-on-surface">{user?.name}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">{role}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 rounded-xl ghost-border py-2.5 text-sm font-medium text-on-surface-variant transition-all duration-200 hover:bg-error/10 hover:text-error hover:border-error/20"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                </svg>
                                Sign out
                            </button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};