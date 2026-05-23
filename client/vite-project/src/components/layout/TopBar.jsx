import { useAuth } from "../../hooks/useAuth.js";
import { DarkModeToggle } from "../ui/DarkModeToggle.jsx";
import { motion } from "framer-motion";

export const TopBar = ({ isSidebarOpen, onToggleSidebar }) => {
    const { user } = useAuth();

    return (
        <header className="fixed top-0 right-0 z-40 h-16 w-full topbar-glass">
            <motion.div
                animate={{ x: isSidebarOpen ? 256 : 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 25
                }}
                className="h-full px-6 lg:px-8 flex items-center justify-between"
            >
                {/* LEFT */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="flex h-9 w-9 items-center justify-center rounded-xl ghost-border bg-surface-container-lowest text-on-surface-variant transition-all duration-200 hover:bg-surface-container hover:text-primary active:scale-95"
                        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        <motion.div
                            animate={{ rotate: isSidebarOpen ? 0 : 180 }}
                            transition={{ duration: 0.3 }}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </motion.div>
                    </button>

                    <div className="h-5 w-px bg-outline-variant" />

                    <p className="text-sm font-semibold text-on-surface">
                        Dashboard
                    </p>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="text-right leading-tight">
                            <p className="text-xs font-semibold text-on-surface">
                                {user?.name || "Manager"}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                                {user?.role || "Admin"}
                            </p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-sm font-bold text-on-primary ring-2 ring-primary/20">
                            {(user?.name || "M").charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <div className="h-5 w-px bg-outline-variant" />

                    <DarkModeToggle />
                </div>
            </motion.div>
        </header>
    );
};