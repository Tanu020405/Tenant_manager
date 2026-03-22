/**
 * emailTemplates.js
 * HTML email templates for all transactional emails.
 * Returns { subject, html } objects ready to pass to sendMail().
 */

const BRAND  = "#2563eb";
const GOLD   = "#C8922A";
const DARK   = "#1e293b";
const MUTED  = "#64748b";
const BG     = "#f8fafc";

// ─── shared layout wrapper ────────────────────────────────────────────────────

function layout(title, bodyHtml) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Arial,sans-serif;color:${DARK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr><td style="background:${BRAND};padding:24px 32px;">
          <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">PROPCONNECT</span><br>
          <span style="font-size:11px;color:rgba(255,255,255,.75);">Tenant &amp; Property Management</span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          ${bodyHtml}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:${BG};padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
          <span style="font-size:11px;color:${MUTED};">This is a system-generated email — please do not reply.</span>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Reusable info row for invoice details tables */
function infoRow(label, value, highlight = false) {
    return `<tr>
      <td style="padding:7px 12px;font-size:13px;color:${MUTED};width:45%;">${label}</td>
      <td style="padding:7px 12px;font-size:13px;font-weight:600;color:${highlight ? GOLD : DARK};">${value}</td>
    </tr>`;
}

// ─── 1. Invoice Generated ─────────────────────────────────────────────────────

/**
 * Sent to the renter when a new invoice is created (manual or monthly cron).
 */
export function invoiceGeneratedEmail(invoice, renter) {
    const { period, amount, dueDate, propertySnapshot, _id } = invoice;
    const invoiceNum = _id.toString().slice(-8).toUpperCase();
    const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString("en-IN") : "—";
    const amountStr  = `INR ${Number(amount || 0).toLocaleString("en-IN")}`;

    const html = layout("Your Rent Invoice", `
      <h2 style="margin:0 0 4px;font-size:20px;color:${DARK};">Hi ${renter?.name || "there"},</h2>
      <p style="margin:0 0 20px;font-size:14px;color:${MUTED};">A new rent invoice has been generated for you.</p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        ${infoRow("Invoice #", invoiceNum)}
        ${infoRow("Property", propertySnapshot?.name || "—")}
        ${infoRow("Billing Period", period || "—")}
        ${infoRow("Due Date", dueDateStr)}
        ${infoRow("Amount Due", amountStr, true)}
      </table>

      <p style="font-size:13px;color:${MUTED};margin:0;">
        Please log in to your PropConnect account to view and pay your invoice.
      </p>
    `);

    return {
        subject: `Rent Invoice for ${period} — INR ${Number(amount || 0).toLocaleString("en-IN")}`,
        html,
    };
}

// ─── 2. Payment Confirmed ─────────────────────────────────────────────────────

/**
 * Sent to the renter after a successful payment (verify or webhook).
 */
export function paymentConfirmedEmail(invoice, payment, renter) {
    const { period, amount, propertySnapshot, _id } = invoice;
    const invoiceNum   = _id.toString().slice(-8).toUpperCase();
    const paidOnStr    = payment?.paidAt
        ? new Date(payment.paidAt).toLocaleDateString("en-IN")
        : new Date().toLocaleDateString("en-IN");
    const amountStr    = `INR ${Number(amount || 0).toLocaleString("en-IN")}`;
    const transactionId = payment?.transactionId || "—";

    const html = layout("Payment Confirmed", `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;">✅</div>
        <h2 style="margin:8px 0 4px;font-size:20px;color:${DARK};">Payment Received!</h2>
        <p style="margin:0;font-size:14px;color:${MUTED};">Your rent payment has been successfully processed.</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        ${infoRow("Renter", renter?.name || "—")}
        ${infoRow("Property", propertySnapshot?.name || "—")}
        ${infoRow("Billing Period", period || "—")}
        ${infoRow("Amount Paid", amountStr, true)}
        ${infoRow("Paid On", paidOnStr)}
        ${infoRow("Transaction ID", transactionId)}
        ${infoRow("Invoice #", invoiceNum)}
      </table>

      <p style="font-size:13px;color:${MUTED};margin:0;">
        You can download your payment receipt from the PropConnect portal.
      </p>
    `);

    return {
        subject: `Payment Confirmed — ${period} Rent INR ${Number(amount || 0).toLocaleString("en-IN")}`,
        html,
    };
}

// ─── 3. Overdue Reminder ──────────────────────────────────────────────────────

/**
 * Sent to the renter when their invoice is marked overdue by the daily cron.
 */
export function overdueReminderEmail(invoice, renter) {
    const { period, amount, dueDate, propertySnapshot, _id } = invoice;
    const invoiceNum = _id.toString().slice(-8).toUpperCase();
    const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString("en-IN") : "—";
    const amountStr  = `INR ${Number(amount || 0).toLocaleString("en-IN")}`;

    const html = layout("Overdue Rent Invoice", `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#dc2626;">⚠️ Your rent invoice is overdue</p>
        <p style="margin:4px 0 0;font-size:13px;color:#ef4444;">Please make payment at the earliest to avoid further action.</p>
      </div>

      <h2 style="margin:0 0 4px;font-size:18px;color:${DARK};">Hi ${renter?.name || "there"},</h2>
      <p style="margin:0 0 20px;font-size:14px;color:${MUTED};">
        Your rent payment for <strong>${period}</strong> was due on <strong>${dueDateStr}</strong> and is now overdue.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #fecaca;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        ${infoRow("Invoice #", invoiceNum)}
        ${infoRow("Property", propertySnapshot?.name || "—")}
        ${infoRow("Billing Period", period || "—")}
        ${infoRow("Due Date", dueDateStr)}
        ${infoRow("Amount Due", amountStr, true)}
      </table>

      <p style="font-size:13px;color:${MUTED};margin:0;">
        Please log in to PropConnect to pay your overdue invoice immediately.
      </p>
    `);

    return {
        subject: `⚠️ Overdue Rent Invoice — ${period} (${amountStr})`,
        html,
    };
}
