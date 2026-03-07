import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { Sidebar } from "./Sidebar.jsx";

/**
 * AppShell — authenticated layout: sidebar + main content.
 * Redirects to /login if not authenticated.
 * Optionally restricts to a specific role.
 */
export const AppShell = ({ requiredRole }) => {
    const { isAuthenticated, role } = useAuth();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;

    return (
        <div className="flex h-screen overflow-hidden bg-[color:var(--color-background)]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                <Outlet />
            </main>
        </div>
    );
};
