import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { propertiesRoute, propertyRoute } from "../../utils/api.js";
import { Card, CardBody } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { motion } from "framer-motion";

const emptyForm = { name: "", address: "", rent: "", description: "" };

const PropertiesPage = () => {
    const { tenantId } = useAuth();
    const api = useApi();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const res = await api.get(propertiesRoute(tenantId));
            setProperties(res.data.data || []);
        } catch { setError("Failed to load properties."); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (tenantId) load(); }, [tenantId]);

    const openAdd = () => { setEditTarget(null); setForm(emptyForm); setModalOpen(true); };
    const openEdit = (p) => { setEditTarget(p); setForm({ name: p.name, address: p.address, rent: p.rent, description: p.description || "" }); setModalOpen(true); };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editTarget) {
                await api.put(propertyRoute(tenantId, editTarget._id), { ...form, rent: Number(form.rent) });
            } else {
                await api.post(propertiesRoute(tenantId), { ...form, rent: Number(form.rent) });
            }
            setModalOpen(false);
            await load();
        } catch (err) {
            setError(err.response?.data?.error?.message || "Save failed.");
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this property?")) return;
        await api.delete(propertyRoute(tenantId, id));
        await load();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-on-surface font-headline">Properties</h1>
                    <p className="text-sm text-on-surface-variant mt-1">Manage your rental portfolio and occupancy.</p>
                </div>
                <Button onClick={openAdd}>+ Add Property</Button>
            </div>

            {error && <p className="rounded-xl border border-error/20 bg-error-container/40 px-4 py-2.5 text-sm text-on-error-container">{error}</p>}

            {loading ? <PageSpinner /> : properties.length === 0 ? (
                <EmptyState icon="🏠" title="No properties yet" description="Add your first property to get started." action={<Button onClick={openAdd}>+ Add Property</Button>} />
            ) : (
                <motion.div
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    initial="hidden"
                    animate="visible"
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                >
                    {properties.map((p) => (
                        <motion.div
                            key={p._id}
                            variants={{
                                hidden: { opacity: 0, y: 16 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
                            }}
                        >
                            <Card>
                                <CardBody>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-on-surface">{p.name}</p>
                                            <p className="mt-0.5 truncate text-xs text-on-surface-variant">{p.address}</p>
                                        </div>
                                        <Badge label={p.available ? "available" : "occupied"} />
                                    </div>
                                    <p className="mt-3 text-2xl font-bold text-primary">₹{p.rent?.toLocaleString()}<span className="text-xs font-normal text-on-surface-variant">/mo</span></p>
                                    {p.description && <p className="mt-2 text-xs text-on-surface-variant line-clamp-2">{p.description}</p>}
                                    <div className="mt-5 flex gap-2">
                                        <Button variant="ghost" className="flex-1 text-xs" onClick={() => openEdit(p)}>Edit</Button>
                                        <Button variant="danger" className="flex-1 text-xs" onClick={() => handleDelete(p._id)}>Delete</Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Property" : "Add Property"}>
                <form onSubmit={handleSave} className="space-y-4">
                    {[
                        { label: "Name", name: "name", type: "text", placeholder: "Block A - Unit 12" },
                        { label: "Address", name: "address", type: "text", placeholder: "123 MG Road, Bangalore" },
                        { label: "Monthly Rent (₹)", name: "rent", type: "number", placeholder: "12000" },
                        { label: "Description", name: "description", type: "text", placeholder: "Optional notes..." },
                    ].map(({ label, name, type, placeholder }) => (
                        <label key={name} className="block space-y-1.5 text-sm">
                            <span className="font-medium text-on-surface">{label}</span>
                            <input type={type} name={name} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                                placeholder={placeholder} required={name !== "description"}
                                className="w-full rounded-xl ghost-border bg-surface-container-lowest px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                        </label>
                    ))}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1" loading={saving}>Save</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PropertiesPage;
