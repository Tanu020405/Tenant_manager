import Invoice from "../models/invoiceModel.js";
import Payment from "../models/paymentModel.js";

/**
 * GET /analytics/revenue  (tenant only)
 * Total revenue collected, grouped by period.
 * Optional ?period=2026-03 to filter a specific month.
 */
export const getRevenue = async (req, res, next) => {
    try {
        const { period } = req.query;
        const matchStage = { tenantId: req.tenantId, isDeleted: false, status: "success" };
        if (period) matchStage["invoiceId.period"] = period;

        // Aggregate on Payment collection — actual money received
        const pipeline = [
            { $match: { tenantId: req.tenantId, status: "success", isDeleted: false } },
            {
                $lookup: {
                    from: "invoices",
                    localField: "invoiceId",
                    foreignField: "_id",
                    as: "invoice",
                },
            },
            { $unwind: "$invoice" },
            ...(period ? [{ $match: { "invoice.period": period } }] : []),
            {
                $group: {
                    _id: "$invoice.period",
                    totalRevenue: { $sum: "$amount" },
                    paymentCount: { $sum: 1 },
                },
            },
            { $sort: { _id: -1 } }, // most recent period first
            {
                $project: {
                    _id: 0,
                    period: "$_id",
                    totalRevenue: 1,
                    paymentCount: 1,
                },
            },
        ];

        const revenue = await Payment.aggregate(pipeline);
        res.json({ success: true, data: revenue });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /analytics/pending  (tenant only)
 * Count and total value of all pending invoices.
 */
export const getPendingInvoices = async (req, res, next) => {
    try {
        const result = await Invoice.aggregate([
            {
                $match: {
                    tenantId: req.tenantId,
                    status: "pending",
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$rentSnapshot" },
                },
            },
            {
                $project: { _id: 0, count: 1, totalAmount: 1 },
            },
        ]);

        const data = result[0] || { count: 0, totalAmount: 0 };
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /analytics/overdue  (tenant only)
 * Count, total value, and list of overdue invoices.
 */
export const getOverdueInvoices = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const [summary, invoices, total] = await Promise.all([
            // Aggregate totals
            Invoice.aggregate([
                {
                    $match: {
                        tenantId: req.tenantId,
                        status: "overdue",
                        isDeleted: false,
                    },
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        totalAmount: { $sum: "$rentSnapshot" },
                    },
                },
                { $project: { _id: 0, count: 1, totalAmount: 1 } },
            ]),
            // Paginated list
            Invoice.find({ tenantId: req.tenantId, status: "overdue", isDeleted: false })
                .populate("renter", "name email")
                .populate("property", "name address")
                .sort({ dueDate: 1 }) // oldest overdue first
                .skip((page - 1) * limit)
                .limit(Number(limit)),
            // Total count for pagination
            Invoice.countDocuments({ tenantId: req.tenantId, status: "overdue", isDeleted: false }),
        ]);

        res.json({
            success: true,
            data: {
                ...(summary[0] || { count: 0, totalAmount: 0 }),
                invoices,
                total,
            },
        });
    } catch (err) {
        next(err);
    }
};
