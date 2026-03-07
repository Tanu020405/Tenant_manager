/**
 * useAuth — reads the authenticated user and token from localStorage.
 * No state — just a synchronous read. Components can re-read on mount.
 */
export const useAuth = () => {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("user");

    let user = null;
    try {
        user = raw ? JSON.parse(raw) : null;
    } catch {
        localStorage.removeItem("user");
    }

    return {
        token,
        user,
        tenantId: user?.tenantId ?? null,
        role: user?.role ?? null,
        isAuthenticated: Boolean(token && user),
    };
};
