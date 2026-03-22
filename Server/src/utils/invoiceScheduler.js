/**
 * invoiceScheduler.js
 *
 * 1. markOverdueInvoices()     — run daily  (0 0 * * *)
 *    Marks pending invoices as "overdue" if dueDate has passed.
 *    Sends overdue reminder email to each affected renter.
 *
 * 2. generateMonthlyInvoices() — run monthly (5 0 1 * *)
 *    Auto-generates invoices for all occupied properties on the 1st of each month.
 *    Sends invoice-generated email to each renter.
 */

import Invoice from "../models/invoiceModel.js";
import Property from "../models/propertyModel.js";
import { sendMail } from "./mailer.js";
import { overdueReminderEmail, invoiceGeneratedEmail } from "./emailTemplates.js";

// ─── Overdue Detection ────────────────────────────────────────────────────────

export const markOverdueInvoices = async () => {
    try {
        // Switched from updateMany to a per-invoice loop so we can email each renter
        const overdueInvoices = await Invoice.find({
            status: "pending",
            dueDate: { $lt: new Date() },
            isDeleted: false,
        }).populate("renter", "name email");

        let marked = 0;

        for (const invoice of overdueInvoices) {
            invoice.status = "overdue";
            await invoice.save();
            marked++;

            // Fire-and-forget overdue reminder
            if (invoice.renter?.email) {
                const emailData = overdueReminderEmail(invoice, invoice.renter);
                sendMail({ to: invoice.renter.email, ...emailData });
            }
        }

        console.log(`[Scheduler] Marked ${marked} invoice(s) as overdue.`);
        return marked;
    } catch (err) {
        console.error("[Scheduler] Failed to mark overdue invoices:", err.message);
        throw err;
    }
};

// ─── Monthly Invoice Auto-Generation ─────────────────────────────────────────

export const generateMonthlyInvoices = async () => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log(`[Scheduler] Generating invoices for period: ${period}`);

    try {
        const occupiedProperties = await Property.find({
            available: false,
            currentRenter: { $exists: true, $ne: null },
            isDeleted: false,
        }).populate("currentRenter");

        let created = 0;
        let skipped = 0;

        for (const property of occupiedProperties) {
            const renter = property.currentRenter;

            if (!renter || renter.isDeleted || !renter.active) {
                skipped++;
                continue;
            }

            const existing = await Invoice.findOne({
                property: property._id,
                renter: renter._id,
                tenantId: property.tenantId,
                period,
                isDeleted: false,
            });

            if (existing) {
                skipped++;
                continue;
            }

            const invoice = await Invoice.create({
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

            // Fire-and-forget — email renter about auto-generated invoice
            if (renter.email) {
                const emailData = invoiceGeneratedEmail(invoice, renter);
                sendMail({ to: renter.email, ...emailData });
            }
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
