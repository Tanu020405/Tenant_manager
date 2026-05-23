import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { paymentHistoryRoute } from "../../utils/api.js";
import { Badge } from "../../components/ui/Badge.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { motion } from "framer-motion";

const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

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
                <h1 className="text-2xl font-semibold text-on-surface font-headline">My Payments</h1>
                <p className="text-sm text-on-surface-variant mt-1">History of all payments you've made</p>
            </div>

            {loading ? <PageSpinner /> : payments.length === 0 ? (
                <EmptyState icon="💳" title="No payments yet" description="Your payment history will appear here after your first payment." />
            ) : (
                <div className="space-y-3">
                    {payments.map((p, i) => (
                        <motion.div
                            key={p._id}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                            className="flex items-center justify-between rounded-2xl ghost-border bg-surface-container-lowest px-5 py-4 shadow-ambient-sm hover:shadow-ambient transition-all duration-200 hover:-translate-y-0.5"
                        >
                            <div>
                                <p className="font-semibold text-on-surface">
                                    {p.invoiceId?.period || "—"}
                                </p>
                                <p className="mt-1">
                                    <span className="inline-block max-w-[180px] truncate rounded-md bg-surface-container/60 px-2 py-0.5 font-mono text-[11px] text-on-surface-variant">
                                        Txn: {p.transactionId}
                                    </span>
                                </p>
                                <p className="mt-0.5 text-xs text-on-surface-variant">
                                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}
                                </p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <p className="text-xl font-bold text-primary">₹{p.amount?.toLocaleString()}</p>
                                <Badge label={p.status} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyPaymentsPage;
