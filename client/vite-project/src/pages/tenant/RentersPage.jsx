import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { rentersRoute, renterRoute, propertiesRoute } from "../../utils/api.js";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";

const emptyForm = { name: "", email: "", phone: "", propertyId: "" };

const RentersPage = () => {
    const { tenantId } = useAuth();
    const api = useApi();
    const [renters, setRenters] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const [r, p] = await Promise.all([
                api.get(rentersRoute(tenantId)),
                api.get(propertiesRoute(tenantId)),
            ]);
            setRenters(r.data.data || []);
            setProperties(p.data.data || []);
        } catch { setError("Failed to load renters."); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (tenantId) load(); }, [tenantId]);

    const openAdd = () => { setEditTarget(null); setForm(emptyForm); setModalOpen(true); };
    const openEdit = (r) => {
        setEditTarget(r);
        setForm({ name: r.name, email: r.email, phone: r.phone || "", propertyId: r.property?._id || "" });
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { name: form.name, email: form.email, phone: form.phone, property: form.propertyId || undefined };
            if (editTarget) await api.put(renterRoute(tenantId, editTarget._id), payload);
            else await api.post(rentersRoute(tenantId), payload);
            setModalOpen(false);
            await load();
        } catch (err) {
            setError(err.response?.data?.error?.message || "Save failed.");
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this renter?")) return;
        await api.delete(renterRoute(tenantId, id));
        await load();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[color:var(--color-primary)]">Renters</h1>
                    <p className="text-sm text-[color:var(--color-muted)]">Manage tenants on your properties</p>
                </div>
                <Button onClick={openAdd}>+ Add Renter</Button>
            </div>

            {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>}

            {loading ? <PageSpinner /> : renters.length === 0 ? (
                <EmptyState icon="👥" title="No renters yet" description="Add renters and assign them to properties." action={<Button onClick={openAdd}>+ Add Renter</Button>} />
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                                    {["Name", "Email", "Phone", "Property", "Status", ""].map(h => (
                                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {renters.map((r) => (
                                    <tr key={r._id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-[color:var(--color-text)]">{r.name}</td>
                                        <td className="px-4 py-3 text-[color:var(--color-muted)]">{r.email}</td>
                                        <td className="px-4 py-3 text-[color:var(--color-muted)]">{r.phone || "—"}</td>
                                        <td className="px-4 py-3 text-[color:var(--color-muted)]">{r.property?.name || "Unassigned"}</td>
                                        <td className="px-4 py-3"><Badge label={r.active ? "active" : "inactive"} /></td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => openEdit(r)}>Edit</Button>
                                                <Button variant="danger" className="text-xs px-2 py-1" onClick={() => handleDelete(r._id)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Renter" : "Add Renter"}>
                <form onSubmit={handleSave} className="space-y-4">
                    {[
                        { label: "Full Name", name: "name", type: "text", placeholder: "Rahul Sharma", required: true },
                        { label: "Email", name: "email", type: "email", placeholder: "rahul@example.com", required: true },
                        { label: "Phone", name: "phone", type: "tel", placeholder: "+91 98765 43210", required: false },
                    ].map(({ label, name, type, placeholder, required }) => (
                        <label key={name} className="block space-y-1 text-sm">
                            <span className="font-medium text-[color:var(--color-text)]">{label}</span>
                            <input type={type} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                                placeholder={placeholder} required={required}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/20" />
                        </label>
                    ))}
                    <label className="block space-y-1 text-sm">
                        <span className="font-medium text-[color:var(--color-text)]">Assign Property</span>
                        <select value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-accent)] focus:outline-none">
                            <option value="">— None —</option>
                            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </label>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1" loading={saving}>Save</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RentersPage;
