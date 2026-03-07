import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { paymentHistoryRoute } from "../../utils/api.js";
import { Card } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";

const PaymentsPage = () => {
    const { tenantId } = useAuth();
    const api = useApi();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!tenantId) return;
        (async () => {
            try {
                const res = await api.get(paymentHistoryRoute(tenantId));
                setPayments(res.data.data || []);
            } catch { setError("Failed to load payments."); }
            finally { setLoading(false); }
        })();
    }, [tenantId]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[color:var(--color-primary)]">Payments</h1>
                <p className="text-sm text-[color:var(--color-muted)]">All received payments across your properties</p>
            </div>

            {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>}

            {loading ? <PageSpinner /> : payments.length === 0 ? (
                <EmptyState icon="💳" title="No payments yet" description="Payments will appear here once renters complete checkout." />
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                                    {["Renter", "Period", "Amount", "Transaction ID", "Date", "Status"].map(h => (
                                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payments.map((p) => (
                                    <tr key={p._id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-[color:var(--color-text)]">
                                            {p.renterId?.name || "—"}
                                            <span className="block text-xs font-normal text-[color:var(--color-muted)]">{p.renterId?.email}</span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-[color:var(--color-muted)]">{p.invoiceId?.period || "—"}</td>
                                        <td className="px-4 py-3 font-bold text-[color:var(--color-primary)]">₹{p.amount?.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-[color:var(--color-muted)] max-w-[140px] truncate">{p.transactionId}</td>
                                        <td className="px-4 py-3 text-[color:var(--color-muted)]">
                                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN") : "—"}
                                        </td>
                                        <td className="px-4 py-3"><Badge label={p.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default PaymentsPage;
