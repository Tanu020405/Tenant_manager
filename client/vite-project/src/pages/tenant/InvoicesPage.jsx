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

const STATUSES = ["all", "pending", "paid", "overdue"];

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[color:var(--color-primary)]">Invoices</h1>
                    <p className="text-sm text-[color:var(--color-muted)]">Track all rental invoices</p>
                </div>
                <Button onClick={() => setModalOpen(true)}>+ Generate Invoice</Button>
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
                {STATUSES.map(s => (
                    <button key={s} onClick={() => setTab(s)}
                        className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition ${tab === s ? "bg-white shadow-sm text-[color:var(--color-primary)]" : "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"}`}>
                        {s}
                    </button>
                ))}
            </div>

            {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>}

            {loading ? <PageSpinner /> : invoices.length === 0 ? (
                <EmptyState icon="🧾" title="No invoices" description={`No ${tab === "all" ? "" : tab} invoices found.`} action={tab === "all" && <Button onClick={() => setModalOpen(true)}>+ Generate Invoice</Button>} />
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                                    {["Period", "Renter", "Property", "Amount", "Due Date", "Status", ""].map(h => (
                                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoices.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-mono text-xs text-[color:var(--color-text)]">{inv.period}</td>
                                        <td className="px-4 py-3 text-[color:var(--color-text)]">{inv.renter?.name || "—"}</td>
                                        <td className="px-4 py-3 text-[color:var(--color-muted)]">{inv.propertySnapshot?.name || inv.property?.name || "—"}</td>
                                        <td className="px-4 py-3 font-semibold text-[color:var(--color-primary)]">₹{inv.rentSnapshot?.toLocaleString() ?? inv.amount?.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-[color:var(--color-muted)]">{new Date(inv.dueDate).toLocaleDateString("en-IN")}</td>
                                        <td className="px-4 py-3"><Badge label={inv.status} /></td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDownload(inv)}
                                                disabled={downloadingId === inv._id}
                                                title="Download PDF"
                                                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-[color:var(--color-muted)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] disabled:opacity-40"
                                            >
                                                {downloadingId === inv._id ? "..." : "📄 PDF"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Invoice">
                <form onSubmit={handleGenerate} className="space-y-4">
                    <label className="block space-y-1 text-sm">
                        <span className="font-medium text-[color:var(--color-text)]">Renter</span>
                        <select required value={form.renterId} onChange={e => setForm(f => ({ ...f, renterId: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-accent)] focus:outline-none">
                            <option value="">Select renter</option>
                            {renters.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                    </label>
                    <label className="block space-y-1 text-sm">
                        <span className="font-medium text-[color:var(--color-text)]">Property</span>
                        <select required value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-accent)] focus:outline-none">
                            <option value="">Select property</option>
                            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </label>
                    <label className="block space-y-1 text-sm">
                        <span className="font-medium text-[color:var(--color-text)]">Period (YYYY-MM)</span>
                        <input type="month" required value={form.period.replaceAll("-", "-")}
                            onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[color:var(--color-accent)] focus:outline-none" />
                    </label>
                    {error && <p className="text-xs text-rose-500">{error}</p>}
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
