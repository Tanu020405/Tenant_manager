import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { invoicesRoute, generateInvoiceRoute, rentersRoute, propertiesRoute, invoicePdfRoute } from "../../utils/api.js";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { motion } from "framer-motion";

const STATUSES = ["all", "pending", "paid", "overdue"];

const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const InvoicesPage = () => {
    const { tenantId } = useAuth();
    const api = useApi();
    const [invoices, setInvoices] = useState([]);
    const [renters, setRenters] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ renterId: "", propertyId: "", period: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [downloadingId, setDownloadingId] = useState(null);

    const handleDownload = async (inv) => {
        setDownloadingId(inv._id);
        try {
            const res = await api.get(invoicePdfRoute(tenantId, inv._id), { responseType: "blob" });
            const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-${inv.period}-${inv._id.slice(-8)}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setError("Failed to download PDF.");
        } finally {
            setDownloadingId(null);
        }
    };

    const load = async () => {
        setLoading(true);
        try {
            const params = tab !== "all" ? `?status=${tab}` : "";
            const [inv, r, p] = await Promise.all([
                api.get(`${invoicesRoute(tenantId)}${params}`),
                api.get(rentersRoute(tenantId)),
                api.get(propertiesRoute(tenantId)),
            ]);
            setInvoices(inv.data.data || []);
            setRenters(r.data.data || []);
            setProperties(p.data.data || []);
        } catch { setError("Failed to load invoices."); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (tenantId) load(); }, [tenantId, tab]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await api.post(generateInvoiceRoute(tenantId), form);
            setModalOpen(false);
            setForm({ renterId: "", propertyId: "", period: "" });
            await load();
        } catch (err) {
            setError(err.response?.data?.error?.message || "Failed to generate invoice.");
        } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-on-surface font-headline">Invoices</h1>
                    <p className="text-sm text-on-surface-variant mt-1">Track billing cycles and payment status.</p>
                </div>
                <Button onClick={() => setModalOpen(true)}>+ Generate Invoice</Button>
            </div>

            {/* Status tabs with animated indicator */}
            <div className="relative flex gap-1 rounded-2xl bg-surface-container-low/80 p-1 shadow-ambient-sm w-fit">
                {STATUSES.map(s => (
                    <button key={s} onClick={() => setTab(s)}
                        className={`relative z-10 rounded-xl px-4 py-1.5 text-sm font-medium capitalize transition-colors duration-200 ${tab === s ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}>
                        {tab === s && (
                            <motion.div
                                layoutId="invoice-tab-indicator"
                                className="absolute inset-0 rounded-xl bg-surface-container-lowest shadow-sm"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                style={{ zIndex: -1 }}
                            />
                        )}
                        {s}
                    </button>
                ))}
            </div>

            {error && <p className="rounded-xl border border-error/20 bg-error-container/40 px-4 py-2.5 text-sm text-on-error-container">{error}</p>}

            {loading ? <PageSpinner /> : invoices.length === 0 ? (
                <EmptyState icon="🧾" title="No invoices" description={`No ${tab === "all" ? "" : tab} invoices found.`} action={tab === "all" && <Button onClick={() => setModalOpen(true)}>+ Generate Invoice</Button>} />
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-outline-variant bg-surface-container-lowest/70 text-left text-xs uppercase tracking-wider text-on-surface-variant">
                                    {["Period", "Renter", "Property", "Amount", "Due Date", "Status", ""].map(h => (
                                        <th key={h} className="px-4 py-3.5 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/60">
                                {invoices.map((inv, i) => (
                                    <motion.tr
                                        key={inv._id}
                                        custom={i}
                                        initial="hidden"
                                        animate="visible"
                                        variants={rowVariants}
                                        className="hover:bg-surface-container-low/70 transition-colors duration-150"
                                    >
                                        <td className="px-4 py-3.5 font-mono text-xs text-on-surface">{inv.period}</td>
                                        <td className="px-4 py-3.5 text-on-surface">{inv.renter?.name || "—"}</td>
                                        <td className="px-4 py-3.5 text-on-surface-variant">{inv.propertySnapshot?.name || inv.property?.name || "—"}</td>
                                        <td className="px-4 py-3.5 font-semibold text-primary">₹{inv.rentSnapshot?.toLocaleString() ?? inv.amount?.toLocaleString()}</td>
                                        <td className="px-4 py-3.5 text-on-surface-variant">{new Date(inv.dueDate).toLocaleDateString("en-IN")}</td>
                                        <td className="px-4 py-3.5"><Badge label={inv.status} /></td>
                                        <td className="px-4 py-3.5">
                                            <button
                                                onClick={() => handleDownload(inv)}
                                                disabled={downloadingId === inv._id}
                                                title="Download PDF"
                                                className="flex items-center gap-1.5 rounded-lg ghost-border bg-surface-container-lowest/70 px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-all duration-200 hover:text-primary hover:-translate-y-0.5 disabled:opacity-40"
                                            >
                                                {downloadingId === inv._id ? (
                                                    <span className="h-3 w-3 animate-spin rounded-full border border-current/30 border-t-current" />
                                                ) : "📄"} PDF
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Invoice">
                <form onSubmit={handleGenerate} className="space-y-4">
                    <label className="block space-y-1.5 text-sm">
                        <span className="font-medium text-on-surface">Renter</span>
                        <select required value={form.renterId} onChange={e => setForm(f => ({ ...f, renterId: e.target.value }))}
                            className="w-full rounded-xl ghost-border bg-surface-container-lowest px-4 py-2.5 text-sm focus:border-primary focus:outline-none">
                            <option value="">Select renter</option>
                            {renters.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                    </label>
                    <label className="block space-y-1.5 text-sm">
                        <span className="font-medium text-on-surface">Property</span>
                        <select required value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                            className="w-full rounded-xl ghost-border bg-surface-container-lowest px-4 py-2.5 text-sm focus:border-primary focus:outline-none">
                            <option value="">Select property</option>
                            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </label>
                    <label className="block space-y-1.5 text-sm">
                        <span className="font-medium text-on-surface">Period (YYYY-MM)</span>
                        <input type="month" required value={form.period.replaceAll("-", "-")}
                            onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                            className="w-full rounded-xl ghost-border bg-surface-container-lowest px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                    </label>
                    {error && <p className="text-xs text-on-error-container">{error}</p>}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1" loading={saving}>Generate</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default InvoicesPage;
