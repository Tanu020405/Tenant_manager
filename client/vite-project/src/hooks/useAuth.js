/**
 * useAuth — reads the authenticated user and token from localStorage.
 */
export const useAuth = () => {
    const readToken = localStorage.getItem("token");
    const raw = localStorage.getItem("user");

    let user = null;
    try {
        user = raw ? JSON.parse(raw) : null;
    } catch {
        localStorage.removeItem("user");
    }

    const isTokenExpired = (jwtToken) => {
        if (!jwtToken) return true;
        try {
            const payloadRaw = jwtToken.split(".")[1];
            const base64 = payloadRaw.replace(/-/g, "+").replace(/_/g, "/");
            const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
            const payload = JSON.parse(atob(padded));
            if (!payload?.exp) return false;
            return payload.exp * 1000 <= Date.now();
        } catch {
            return true;
        }
    };

    let token = readToken;
    if (isTokenExpired(readToken)) {
        token = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        user = null;
    }

    // Allow components (like Settings) to update the cached tenant data
    // so the Sidebar updates without a full page reload.
    const setTenantData = (tenantData) => {
        if (!user) return;
        const updatedUser = { ...user, tenant: tenantData };
        localStorage.setItem("user", JSON.stringify(updatedUser)); // Triggers re-render on next tick for components reading from local storage directly (not perfect react state, but works for simple app structure)
        
        // This forces a window reload since we aren't using React Context for user state yet
        // A full reload ensures all components (Sidebar, AppShell) get the fresh name/logo/theme
        window.location.reload(); 
    };

    return {
        token,
        user,
        tenantId: user?.tenantId ?? null,
        role: user?.role ?? null,
        isAuthenticated: Boolean(token && user),
        setTenantData,
    };
};
