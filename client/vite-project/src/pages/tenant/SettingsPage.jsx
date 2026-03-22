import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { authRoutes } from "../../utils/api.js";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { applyTheme } from "../../utils/theme.js";

const SettingsPage = () => {
    const { tenantId, user, setTenantData } = useAuth();
    const api = useApi();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const [name, setName] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [theme, setTheme] = useState({
        primary: "#1f2937",
        accent: "#2563eb",
        background: "#f8fafc",
        surface: "#ffffff",
        text: "#111827",
        muted: "#6b7280",
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(authRoutes.tenantProfile);
                const tenant = res.data.data;
                setName(tenant.name || "");
                setLogoUrl(tenant.assets?.logoUrl || "");
                if (tenant.theme) {
                    setTheme({ ...theme, ...tenant.theme });
                }
            } catch (err) {
                setMessage({ type: "error", text: "Failed to load settings" });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleThemeChange = (key, value) => {
        const newTheme = { ...theme, [key]: value };
        setTheme(newTheme);
        // Live preview
        applyTheme(newTheme);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: "", text: "" });
        try {
            const res = await api.put(authRoutes.tenantProfile, { name, logoUrl, theme });
            // Update auth context so sidebar/header update immediately
            if (setTenantData) setTenantData(res.data.data);
            setMessage({ type: "success", text: "Settings saved successfully" });
        } catch (err) {
            setMessage({ type: "error", text: "Failed to save settings: " + err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <PageSpinner />;

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-[color:var(--color-primary)]">Settings</h1>
                <p className="text-sm text-[color:var(--color-muted)]">Manage your workspace branding and theme</p>
            </div>

            {message.text && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                               : "bg-rose-50 text-rose-700 border border-rose-100"
                }`}>
                    {message.text}
                </div>
            )}

            <Card>
                <CardHeader title="Workspace Profile" subtitle="Basic information about your organization" />
                <CardBody>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[color:var(--color-text)]">Workspace Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[color:var(--color-accent)] focus:ring-1 focus:ring-[color:var(--color-accent)]"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[color:var(--color-text)]">Logo URL (Optional)</label>
                            <input
                                type="url"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[color:var(--color-accent)] focus:ring-1 focus:ring-[color:var(--color-accent)]"
                            />
                            {logoUrl && (
                                <div className="mt-3">
                                    <p className="mb-1 text-xs text-[color:var(--color-muted)]">Preview:</p>
                                    <img src={logoUrl} alt="Logo preview" className="h-10 object-contain" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader title="Theme Colors" subtitle="Customize the look and feel of your portal" />
                <CardBody>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {Object.entries(theme).map(([key, val]) => (
                            <div key={key} className="flex items-center space-x-3">
                                <input
                                    type="color"
                                    value={val}
                                    onChange={(e) => handleThemeChange(key, e.target.value)}
                                    className="h-10 w-14 cursor-pointer rounded border-0 p-0"
                                />
                                <div>
                                    <p className="text-sm font-medium capitalize text-[color:var(--color-text)]">{key}</p>
                                    <p className="text-xs uppercase text-[color:var(--color-muted)]">{val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-[color:var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;
