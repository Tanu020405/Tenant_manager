import { useEffect, useState } from "react";
import { useRazorpay } from "react-razorpay";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { myInvoicesRoute, createOrderRoute, verifyPaymentRoute, invoicePdfRoute } from "../../utils/api.js";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";
import { motion } from "framer-motion";

const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const MyInvoicesPage = () => {
    const { tenantId } = useAuth();
    const api = useApi();
    const { Razorpay } = useRazorpay();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get(myInvoicesRoute(tenantId));
            setInvoices(res.data.data || []);
        } catch { setError("Failed to load invoices."); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (tenantId) load(); }, [tenantId]);

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

    const handlePay = async (invoice) => {
        setPayingId(invoice._id);
        setError("");
        try {
            // Step 1 — create Razorpay order on backend
            const orderRes = await api.post(createOrderRoute(tenantId), { invoiceId: invoice._id });
            const { orderId, amount, currency, keyId, invoiceId } = orderRes.data.data;

            // Step 2 — open Razorpay checkout
            const options = {
                key: keyId,
                amount,
                currency,
                order_id: orderId,
                name: "Rental Payment",
                description: `Invoice for ${invoice.period}`,
                handler: async (response) => {
                    // Step 3 — send signature to backend for verification
                    try {
                        await api.post(verifyPaymentRoute(tenantId), {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            invoiceId,
                        });
                        await load(); // Refresh invoice list — status flips to "paid"
                    } catch {
                        setError("Payment verification failed. Contact support.");
                    }
                },
                prefill: {},
                theme: { color: "var(--color-accent, #3b82f6)" },
            };

            if (!Razorpay) {
                setError("Razorpay SDK is not loaded yet.");
                return;
            }

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setError(`Payment failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (err) {
            setError(err.response?.data?.error?.message || err.message || "Failed to initiate payment.");
        } finally {
            setPayingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-on-surface font-headline">My Invoices</h1>
                <p className="text-sm text-on-surface-variant mt-1">View and pay your rental invoices</p>
            </div>

            {error && <p className="rounded-xl bg-error-container/40 border border-error/20 px-4 py-2.5 text-sm text-on-error-container">{error}</p>}

            {loading ? <PageSpinner /> : invoices.length === 0 ? (
                <EmptyState icon="🧾" title="No invoices yet" description="Your landlord hasn't generated any invoices yet." />
            ) : (
                <div className="space-y-3">
                    {invoices.map((inv, i) => (
                        <motion.div
                            key={inv._id}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                            className="flex items-center justify-between rounded-2xl ghost-border bg-surface-container-lowest px-5 py-4 shadow-ambient-sm hover:shadow-ambient transition-all duration-200 hover:-translate-y-0.5"
                        >
                            <div>
                                <div className="flex items-center gap-3">
                                    <p className="font-semibold text-on-surface">
                                        {inv.propertySnapshot?.name || "Property"}
                                    </p>
                                    <Badge label={inv.status} />
                                </div>
                                <p className="mt-1 text-xs text-on-surface-variant">
                                    Period: {inv.period} &nbsp;·&nbsp; Due: {new Date(inv.dueDate).toLocaleDateString("en-IN")}
                                </p>
                                {inv.propertySnapshot?.address && (
                                    <p className="text-xs text-on-surface-variant">{inv.propertySnapshot.address}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-primary">
                                    ₹{inv.rentSnapshot?.toLocaleString() ?? inv.amount?.toLocaleString()}
                                </p>
                                {inv.status === "pending" || inv.status === "overdue" ? (
                                    <Button
                                        className="mt-2 text-xs pulse-glow"
                                        loading={payingId === inv._id}
                                        onClick={() => handlePay(inv)}
                                    >
                                        Pay Now
                                    </Button>
                                ) : (
                                    <div className="mt-2 flex flex-col items-end gap-1.5">
                                        <p className="text-xs text-on-surface-variant font-medium">
                                            ✓ Paid {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("en-IN") : ""}
                                        </p>
                                        <button
                                            onClick={() => handleDownload(inv)}
                                            disabled={downloadingId === inv._id}
                                            className="flex items-center gap-1.5 rounded-lg ghost-border px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-all duration-200 hover:text-primary hover:-translate-y-0.5 disabled:opacity-40"
                                        >
                                            {downloadingId === inv._id ? (
                                                <span className="h-3 w-3 animate-spin rounded-full border border-current/30 border-t-current" />
                                            ) : "📄"} Download PDF
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyInvoicesPage;
