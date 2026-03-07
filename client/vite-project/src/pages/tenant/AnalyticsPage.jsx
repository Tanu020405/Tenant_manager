import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { analyticsRevRoute, analyticsPendRoute, analyticsOvdRoute } from "../../utils/api.js";
import { StatCard } from "../../components/ui/StatCard.jsx";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";

const AnalyticsPage = () => {
    const { tenantId } = useAuth();
    const api = useApi();
    const [revenue, setRevenue] = useState([]);
    const [pending, setPending] = useState({ count: 0, totalAmount: 0 });
    const [overdue, setOverdue] = useState({ count: 0, totalAmount: 0, invoices: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenantId) return;
        (async () => {
            try {
                const [r, p, o] = await Promise.all([
                    api.get(analyticsRevRoute(tenantId)),
                    api.get(analyticsPendRoute(tenantId)),
                    api.get(analyticsOvdRoute(tenantId)),
                ]);
                setRevenue(r.data.data || []);
                setPending(p.data.data || { count: 0, totalAmount: 0 });
                setOverdue(o.data.data || { count: 0, totalAmount: 0, invoices: [] });
            } catch (err) {
                console.error("Analytics load failed:", err);
            } finally { setLoading(false); }
        })();
    }, [tenantId]);

    const totalRevenue = revenue.reduce((sum, r) => sum + r.totalRevenue, 0);

    if (loading) return <PageSpinner />;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[color:var(--color-primary)]">Analytics</h1>
                <p className="text-sm text-[color:var(--color-muted)]">Revenue and invoice health overview</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard icon="💰" label="Total Revenue Collected" value={`₹${totalRevenue.toLocaleString()}`} sub={`across ${revenue.length} billing period(s)`} color="success" />
                <StatCard icon="⏳" label="Pending Amount" value={`₹${pending.totalAmount?.toLocaleString()}`} sub={`${pending.count} pending invoice(s)`} color="warning" />
                <StatCard icon="🚨" label="Overdue Amount" value={`₹${overdue.totalAmount?.toLocaleString()}`} sub={`${overdue.count} overdue invoice(s)`} color="danger" />
            </div>

            {/* Revenue by period */}
            {revenue.length > 0 && (
                <Card>
                    <CardHeader title="Revenue by Period" subtitle="Monthly payment totals" />
                    <CardBody>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                                    <th className="pb-3 font-medium">Period</th>
                                    <th className="pb-3 font-medium">Payments</th>
                                    <th className="pb-3 font-medium text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {revenue.map((r) => (
                                    <tr key={r.period}>
                                        <td className="py-3 font-mono text-xs text-[color:var(--color-text)]">{r.period}</td>
                                        <td className="py-3 text-[color:var(--color-muted)]">{r.paymentCount}</td>
                                        <td className="py-3 text-right font-bold text-[color:var(--color-primary)]">₹{r.totalRevenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>
            )}

            {/* Overdue invoices */}
            {overdue.invoices?.length > 0 && (
                <Card>
                    <CardHeader title="Overdue Invoices" subtitle="Requires immediate attention" />
                    <CardBody>
                        <div className="space-y-3">
                            {overdue.invoices.map((inv) => (
                                <div key={inv._id} className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-[color:var(--color-text)]">{inv.renter?.name || "Unknown"}</p>
                                        <p className="text-xs text-[color:var(--color-muted)]">{inv.propertySnapshot?.name || inv.property?.name} • {inv.period}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-rose-600">₹{inv.rentSnapshot?.toLocaleString()}</p>
                                        <p className="text-xs text-[color:var(--color-muted)]">Due {new Date(inv.dueDate).toLocaleDateString("en-IN")}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default AnalyticsPage;
