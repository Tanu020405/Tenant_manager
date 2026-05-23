import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { Sidebar } from "./Sidebar.jsx";
import { TopBar } from "./TopBar.jsx";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AppShell — authenticated layout: sidebar + main content.
 * Redirects to /login if not authenticated.
 * Optionally restricts to a specific role.
 */
export const AppShell = ({ requiredRole }) => {
    const { isAuthenticated, role } = useAuth();
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (requiredRole && !allowedRoles.includes(role)) return <Navigate to="/" replace />;

    return (
        <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
            <Sidebar isOpen={isSidebarOpen} />
            <TopBar
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            />
            <main className="flex-1 overflow-y-auto pt-24 px-6 pb-10 lg:px-10">
                <div className="signal-surface rounded-2xl p-4 sm:p-6 lg:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};
