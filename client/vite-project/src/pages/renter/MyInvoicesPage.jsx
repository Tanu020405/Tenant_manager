import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { myInvoicesRoute, createOrderRoute, verifyPaymentRoute } from "../../utils/api.js";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { EmptyState } from "../../components/ui/EmptyState.jsx";

const MyInvoicesPage = () => {
    const { tenantId } = useAuth();
    const api = useApi();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);
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

            if (!window.Razorpay) {
                setError("Razorpay not loaded. Check your internet connection.");
                return;
            }

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            setError(err.response?.data?.error?.message || "Failed to initiate payment.");
        } finally {
            setPayingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[color:var(--color-primary)]">My Invoices</h1>
                <p className="text-sm text-[color:var(--color-muted)]">View and pay your rental invoices</p>
            </div>

            {error && <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>}

            {loading ? <PageSpinner /> : invoices.length === 0 ? (
                <EmptyState icon="🧾" title="No invoices yet" description="Your landlord hasn't generated any invoices yet." />
            ) : (
                <div className="space-y-3">
                    {invoices.map((inv) => (
                        <div key={inv._id} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-[color:var(--color-surface)] px-5 py-4 shadow-sm">
                            <div>
                                <div className="flex items-center gap-3">
                                    <p className="font-semibold text-[color:var(--color-primary)]">
                                        {inv.propertySnapshot?.name || "Property"}
                                    </p>
                                    <Badge label={inv.status} />
                                </div>
                                <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                                    Period: {inv.period} &nbsp;·&nbsp; Due: {new Date(inv.dueDate).toLocaleDateString("en-IN")}
                                </p>
                                {inv.propertySnapshot?.address && (
                                    <p className="text-xs text-[color:var(--color-muted)]">{inv.propertySnapshot.address}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-[color:var(--color-primary)]">
                                    ₹{inv.rentSnapshot?.toLocaleString() ?? inv.amount?.toLocaleString()}
                                </p>
                                {inv.status === "pending" || inv.status === "overdue" ? (
                                    <Button
                                        className="mt-2 text-xs"
                                        loading={payingId === inv._id}
                                        onClick={() => handlePay(inv)}
                                    >
                                        Pay Now
                                    </Button>
                                ) : (
                                    <p className="mt-2 text-xs text-emerald-600 font-medium">
                                        ✓ Paid {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("en-IN") : ""}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyInvoicesPage;
