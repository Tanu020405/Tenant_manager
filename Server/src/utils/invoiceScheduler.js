/**
 * invoiceScheduler.js
 *
 * Two exported functions:
 *
 * 1. markOverdueInvoices()     — run daily  (0 0 * * *)
 *    Marks pending invoices as "overdue" if dueDate has passed.
 *
 * 2. generateMonthlyInvoices() — run monthly (5 0 1 * *)
 *    Auto-generates invoices for all occupied properties on the 1st of each month.
 */

import Invoice from "../models/invoiceModel.js";
import Property from "../models/propertyModel.js";

// ─── Overdue Detection ────────────────────────────────────────────────────────

export const markOverdueInvoices = async () => {
    try {
        const result = await Invoice.updateMany(
            {
                status: "pending",
                dueDate: { $lt: new Date() },
                isDeleted: false,
            },
            { $set: { status: "overdue" } }
        );
        console.log(`[Scheduler] Marked ${result.modifiedCount} invoice(s) as overdue.`);
        return result.modifiedCount;
    } catch (err) {
        console.error("[Scheduler] Failed to mark overdue invoices:", err.message);
        throw err;
    }
};

// ─── Monthly Invoice Auto-Generation ─────────────────────────────────────────

export const generateMonthlyInvoices = async () => {
    const now = new Date();
    // Period format: "YYYY-MM" e.g. "2026-03"
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    // Due date: last day of current month
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log(`[Scheduler] Generating invoices for period: ${period}`);

    try {
        // Find all occupied properties (have a currentRenter assigned)
        const occupiedProperties = await Property.find({
            available: false,
            currentRenter: { $exists: true, $ne: null },
            isDeleted: false,
        }).populate("currentRenter");

        let created = 0;
        let skipped = 0;

        for (const property of occupiedProperties) {
            const renter = property.currentRenter;

            // Skip if renter has been soft-deleted or is inactive
            if (!renter || renter.isDeleted || !renter.active) {
                skipped++;
                continue;
            }

            // App-level duplicate guard (DB unique index is the hard guarantee)
            const existing = await Invoice.findOne({
                property: property._id,
                renter: renter._id,
                tenantId: property.tenantId,
                period,
                isDeleted: false,
            });

            if (existing) {
                skipped++;
                continue; // Already generated — safe to skip silently
            }

            await Invoice.create({
                property: property._id,
                renter: renter._id,
                tenantId: property.tenantId,
                amount: property.rent,
                rentSnapshot: property.rent,
                propertySnapshot: {
                    name: property.name,
                    address: property.address,
                },
                dueDate,
                period,
            });

            created++;
        }

        console.log(
            `[Scheduler] Monthly invoices — created: ${created}, skipped (duplicate/inactive): ${skipped}`
        );
        return { created, skipped };
    } catch (err) {
        console.error("[Scheduler] Failed to generate monthly invoices:", err.message);
        throw err;
    }
};
