import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { paymentHistoryRoute } from "../../utils/api.js";
import { Card } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";

const MyPaymentsPage = () => {
    const { tenantId } = useAuth();
    const api = useApi();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;
        (async () => {
            try {
                const res = await api.get(paymentHistoryRoute(tenantId));
                setPayments(res.data.data || []);
            } catch { /* silent */ }
            finally { setLoading(false); }
        })();
    }, [tenantId]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[color:var(--color-primary)]">My Payments</h1>
                <p className="text-sm text-[color:var(--color-muted)]">History of all payments you've made</p>
            </div>

            {loading ? <PageSpinner /> : payments.length === 0 ? (
                <EmptyState icon="💳" title="No payments yet" description="Your payment history will appear here after your first payment." />
            ) : (
                <div className="space-y-3">
                    {payments.map((p) => (
                        <div key={p._id} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-[color:var(--color-surface)] px-5 py-4 shadow-sm">
                            <div>
                                <p className="font-semibold text-[color:var(--color-primary)]">
                                    {p.invoiceId?.period || "—"}
                                </p>
                                <p className="mt-0.5 font-mono text-xs text-[color:var(--color-muted)]">
                                    Txn: {p.transactionId}
                                </p>
                                <p className="text-xs text-[color:var(--color-muted)]">
                                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}
                                </p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <p className="text-xl font-bold text-[color:var(--color-primary)]">₹{p.amount?.toLocaleString()}</p>
                                <Badge label={p.status} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyPaymentsPage;
