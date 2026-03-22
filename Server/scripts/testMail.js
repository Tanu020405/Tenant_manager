/**
 * testMail.js
 * Quick smoke-test for SMTP config + PDF attachment.
 * Usage: node scripts/testMail.js recipient@example.com
 */

import dotenv from "dotenv";
dotenv.config();

import { sendMail } from "../src/utils/mailer.js";
import { invoiceGeneratedEmail, paymentConfirmedEmail } from "../src/utils/emailTemplates.js";
import { generateInvoicePdfBuffer } from "../src/utils/generateInvoicePdf.js";

const to = process.argv[2];
if (!to) {
    console.error("Usage: node scripts/testMail.js recipient@example.com");
    process.exit(1);
}

// Mock data
const mockInvoice = {
    _id: { toString: () => "abc12345678" },
    period: "2026-03",
    amount: 15000,
    dueDate: new Date("2026-03-31"),
    status: "pending",
    paidAt: null,
    propertySnapshot: { name: "Tower 21", address: "Plot 5, Sector 12, Delhi" },
    createdAt: new Date(),
};

const mockRenter = { name: "Deepanshu", email: to, phone: "7035619652" };
const mockPayment = { transactionId: "pay_TestABC123", paidAt: new Date() };

console.log(`\nSending test emails (with PDF) to: ${to}\n`);

// Generate PDF buffer once, reuse for both emails
const pdfBuffer = await generateInvoicePdfBuffer(mockInvoice);
console.log(`✓ PDF generated (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

// Test 1 — Invoice Generated (with PDF attached)
const inv = invoiceGeneratedEmail(mockInvoice, mockRenter);
await sendMail({
    to,
    ...inv,
    attachments: [{
        filename: `invoice-2026-03-12345678.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
    }],
});
console.log("✓ Invoice generated email sent (with PDF)");

// Test 2 — Payment Confirmed (with PDF receipt)
const pay = paymentConfirmedEmail(mockInvoice, mockPayment, mockRenter);
await sendMail({
    to,
    ...pay,
    attachments: [{
        filename: `receipt-2026-03-12345678.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
    }],
});
console.log("✓ Payment confirmed email sent (with PDF)");

console.log("\nDone! Check your inbox — emails should have PDF attachments.");
process.exit(0);
