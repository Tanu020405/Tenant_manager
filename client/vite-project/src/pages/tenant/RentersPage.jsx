import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { rentersRoute, renterRoute, propertiesRoute } from "../../utils/api.js";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { motion } from "framer-motion";

const emptyForm = { name: "", email: "", phone: "", propertyId: "", dateType: "today", customDate: "" };

const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

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
        const hasDate = r.leaseStartDate;
        const formattedDate = hasDate ? new Date(r.leaseStartDate).toISOString().split('T')[0] : "";
        setForm({
            name: r.name,
            email: r.email,
            phone: r.phone || "",
            propertyId: r.property?._id || "",
            dateType: hasDate ? "custom" : "today",
            customDate: formattedDate
        });
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let leaseStartDate = form.dateType === "custom" && form.customDate ? new Date(form.customDate) : new Date();

            const payload = {
                name: form.name,
                email: form.email,
                phone: form.phone,
                property: form.propertyId || null,
                leaseStartDate
            };
            console.log("Saving renter payload:", payload);
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

    const getInitials = (name) => {
        const parts = (name || "?").trim().split(" ");
        return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0][0]?.toUpperCase() || "?";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-on-surface font-headline">Renters</h1>
                    <p className="text-sm text-on-surface-variant mt-1">Track tenant details and lease start dates.</p>
                </div>
                <Button onClick={openAdd}>+ Add Renter</Button>
            </div>

            {error && <p className="rounded-xl border border-error/20 bg-error-container/40 px-4 py-2.5 text-sm text-on-error-container">{error}</p>}

            {loading ? <PageSpinner /> : renters.length === 0 ? (
                <EmptyState icon="👥" title="No renters yet" description="Add renters and assign them to properties." action={<Button onClick={openAdd}>+ Add Renter</Button>} />
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-outline-variant bg-surface-container-lowest/70 text-left text-xs uppercase tracking-wider text-on-surface-variant">
                                    {["Name", "Email", "Phone", "Property", "Status", ""].map(h => (
                                        <th key={h} className="px-4 py-3.5 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/60">
                                {renters.map((r, i) => (
                                    <motion.tr
                                        key={r._id}
                                        custom={i}
                                        initial="hidden"
                                        animate="visible"
                                        variants={rowVariants}
                                        className="hover:bg-surface-container-low/70 transition-colors duration-150"
                                    >
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary-container/30 text-xs font-bold text-primary">
                                                    {getInitials(r.name)}
                                                </div>
                                                <span className="font-medium text-on-surface">{r.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-on-surface-variant">{r.email}</td>
                                        <td className="px-4 py-3.5 text-on-surface-variant">{r.phone || "—"}</td>
                                        <td className="px-4 py-3.5 text-on-surface-variant">
                                            {r.property?.name || "Unassigned"}
                                            {r.property && r.leaseStartDate && (
                                                <div className="mt-0.5 text-xs text-on-surface-variant">
                                                    Starts: {new Date(r.leaseStartDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5"><Badge label={r.active ? "active" : "inactive"} /></td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => openEdit(r)}>Edit</Button>
                                                <Button variant="danger" className="text-xs px-3 py-1.5" onClick={() => handleDelete(r._id)}>Delete</Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Renter" : "Add Renter"}>
                <form onSubmit={handleSave} className="space-y-4">
                    {!editTarget && (
                        <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                            <strong>Note:</strong> Adding a renter sends them a secure password setup email.
                        </div>
                    )}
                    {[
                        { label: "Full Name", name: "name", type: "text", placeholder: "Rahul Sharma", required: true },
                        { label: "Email", name: "email", type: "email", placeholder: "rahul@example.com", required: true },
                        { label: "Phone", name: "phone", type: "tel", placeholder: "+91 98765 43210", required: false },
                    ].map(({ label, name, type, placeholder, required }) => (
                        <label key={name} className="block space-y-1.5 text-sm">
                            <span className="font-medium text-on-surface">{label}</span>
                            <input type={type} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                                placeholder={placeholder} required={required}
                                className="w-full rounded-xl ghost-border bg-surface-container-lowest px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </label>
                    ))}
                    <label className="block space-y-1.5 text-sm">
                        <span className="font-medium text-on-surface">Assign Property</span>
                        <select value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                            className="w-full rounded-xl ghost-border bg-surface-container-lowest px-4 py-2.5 text-sm focus:border-primary focus:outline-none">
                            <option value="">— None —</option>
                            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </label>

                    {form.propertyId && (
                        <div className="space-y-2 rounded-xl border border-outline-variant bg-surface-container/50 p-4">
                            <span className="block text-sm font-medium text-on-surface mb-2">Rent Calculation Starts</span>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                                    <input type="radio" name="dateType" value="today" checked={form.dateType === "today"} onChange={() => setForm(f => ({ ...f, dateType: "today" }))} className="text-primary focus:ring-primary" />
                                    From Today
                                </label>
                                <label className="flex items-center gap-2 text-sm text-on-surface-variant">
                                    <input type="radio" name="dateType" value="custom" checked={form.dateType === "custom"} onChange={() => setForm(f => ({ ...f, dateType: "custom" }))} className="text-primary focus:ring-primary" />
                                    Specific Date
                                </label>
                            </div>
                            {form.dateType === "custom" && (
                                <input type="date" value={form.customDate} onChange={e => setForm(f => ({ ...f, customDate: e.target.value }))}
                                    className="mt-3 w-full rounded-xl ghost-border bg-surface-container-lowest px-4 py-2.5 text-sm focus:border-primary focus:outline-none" required />
                            )}
                        </div>
                    )}

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
