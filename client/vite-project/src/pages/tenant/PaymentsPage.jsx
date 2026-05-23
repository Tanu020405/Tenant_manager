import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { paymentHistoryRoute } from "../../utils/api.js";
import { Card } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { motion } from "framer-motion";

const rowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

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
                <h1 className="text-2xl font-semibold text-on-surface font-headline">Payments</h1>
                <p className="text-sm text-on-surface-variant mt-1">All received payments across your portfolio.</p>
            </div>

            {error && <p className="rounded-xl border border-error/20 bg-error-container/40 px-4 py-2.5 text-sm text-on-error-container">{error}</p>}

            {loading ? <PageSpinner /> : payments.length === 0 ? (
                <EmptyState icon="💳" title="No payments yet" description="Payments will appear here once renters complete checkout." />
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-outline-variant bg-surface-container-lowest/70 text-left text-xs uppercase tracking-wider text-on-surface-variant">
                                    {["Renter", "Period", "Amount", "Transaction ID", "Date", "Status"].map(h => (
                                        <th key={h} className="px-4 py-3.5 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/60">
                                {payments.map((p, i) => (
                                    <motion.tr
                                        key={p._id}
                                        custom={i}
                                        initial="hidden"
                                        animate="visible"
                                        variants={rowVariants}
                                        className="hover:bg-surface-container-low/70 transition-colors duration-150"
                                    >
                                        <td className="px-4 py-3.5">
                                            <p className="font-medium text-on-surface">{p.renterId?.name || "—"}</p>
                                            <span className="text-xs text-on-surface-variant">{p.renterId?.email}</span>
                                        </td>
                                        <td className="px-4 py-3.5 font-mono text-xs text-on-surface-variant">{p.invoiceId?.period || "—"}</td>
                                        <td className="px-4 py-3.5 font-bold text-primary">₹{p.amount?.toLocaleString()}</td>
                                        <td className="px-4 py-3.5">
                                            <span className="inline-block max-w-[140px] truncate rounded-md bg-surface-container/60 px-2 py-0.5 font-mono text-[11px] text-on-surface-variant">
                                                {p.transactionId}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-on-surface-variant">
                                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN") : "—"}
                                        </td>
                                        <td className="px-4 py-3.5"><Badge label={p.status} /></td>
                                    </motion.tr>
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
