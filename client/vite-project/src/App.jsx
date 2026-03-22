import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { applyTheme, getStoredTheme } from "./utils/theme.js";
import { useAuth } from "./hooks/useAuth.js";

// Layout
import { AppShell } from "./components/layout/AppShell.jsx";

// Auth pages (keep existing)
import Register from "./register/Register.jsx";
import Login from "./register/Login.jsx";

// Tenant pages
import PropertiesPage from "./pages/tenant/PropertiesPage.jsx";
import RentersPage from "./pages/tenant/RentersPage.jsx";
import InvoicesPage from "./pages/tenant/InvoicesPage.jsx";
import PaymentsPage from "./pages/tenant/PaymentsPage.jsx";
import AnalyticsPage from "./pages/tenant/AnalyticsPage.jsx";
import SettingsPage from "./pages/tenant/SettingsPage.jsx";

// Renter pages
import MyInvoicesPage from "./pages/renter/MyInvoicesPage.jsx";
import MyPaymentsPage from "./pages/renter/MyPaymentsPage.jsx";

/** Redirects authenticated users to the right home based on their role */
const RoleHome = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === "renter") return <Navigate to="/my-invoices" replace />;
  return <Navigate to="/properties" replace />;  // tenant / superAdmin
};

function App() {
  useEffect(() => {
    const stored = getStoredTheme();
    applyTheme(stored ?? {});
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Role-based home redirect */}
        <Route path="/" element={<RoleHome />} />

        {/* Tenant — authenticated layout */}
        <Route element={<AppShell requiredRole="tenant" />}>
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/renters" element={<RentersPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Renter — authenticated layout */}
        <Route element={<AppShell requiredRole="renter" />}>
          <Route path="/my-invoices" element={<MyInvoicesPage />} />
          <Route path="/my-payments" element={<MyPaymentsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
