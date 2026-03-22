import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApi } from "../../hooks/useApi.js";
import { analyticsRevRoute, analyticsPendRoute, analyticsOvdRoute } from "../../utils/api.js";
import { StatCard } from "../../components/ui/StatCard.jsx";
import { Card, CardHeader, CardBody } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { PageSpinner } from "../../components/ui/Spinner.jsx";
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from "recharts";
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

    // Prepare chart data
    const chartData = [...revenue].reverse().map(r => ({
        period: r.period,
        revenue: r.totalRevenue
    }));

    // Collection Health Data
    const totalBilled = totalRevenue + pending.totalAmount + overdue.totalAmount;
    const paidPercent = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0;
    const healthData = [
        { name: "Paid", value: totalRevenue, color: "var(--color-success)" },
        { name: "Pending", value: pending.totalAmount, color: "var(--color-warning)" },
        { name: "Overdue", value: overdue.totalAmount, color: "var(--color-danger)" },
    ].filter(d => d.value > 0);

    // Helper for days overdue
    const getDaysOverdue = (dueDate) => {
        const diffTime = Math.abs(new Date() - new Date(dueDate));
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

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

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Revenue Chart */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader title="Revenue Trend" subtitle="Monthly collected rent" />
                        <CardBody>
                            {chartData.length > 0 ? (
                                <div className="h-72 w-full pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted)" }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted)" }} tickFormatter={(val) => `₹${val/1000}k`} />
                                            <Tooltip 
                                                cursor={{ fill: "var(--color-accent)", opacity: 0.1 }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
                                            />
                                            <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex h-72 items-center justify-center text-sm text-[color:var(--color-muted)]">No revenue data yet</div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Collection Health */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader title="Collection Health" subtitle="Overall invoice status" />
                        <CardBody>
                            <div className="flex flex-col items-center justify-center py-6">
                                {totalBilled > 0 ? (
                                    <>
                                        <div className="relative h-40 w-40">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={healthData}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                        stroke="none"
                                                    >
                                                        {healthData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-2xl font-bold text-[color:var(--color-primary)]">{paidPercent}%</span>
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">Paid</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6 flex w-full flex-col space-y-2 px-4">
                                            {healthData.map((d) => (
                                                <div key={d.name} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                                        <span className="text-[color:var(--color-muted)]">{d.name}</span>
                                                    </div>
                                                    <span className="font-semibold text-[color:var(--color-text)]">₹{d.value.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex h-40 items-center justify-center text-sm text-[color:var(--color-muted)]">No invoices generated</div>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Overdue invoices */}
            {overdue.invoices?.length > 0 && (
                <Card>
                    <CardHeader title="Overdue Invoices" subtitle="Requires immediate attention" />
                    <CardBody>
                        <div className="space-y-3">
                            {overdue.invoices.map((inv) => (
                                <div key={inv._id} className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-[color:var(--color-text)]">{inv.renter?.name || "Unknown"}</p>
                                            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                                {getDaysOverdue(inv.dueDate)}d overdue
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">{inv.propertySnapshot?.name || inv.property?.name} • {inv.period}</p>
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
