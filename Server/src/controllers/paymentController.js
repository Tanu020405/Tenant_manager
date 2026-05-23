import crypto from "crypto";
import Razorpay from "razorpay";
import Invoice from "../models/invoiceModel.js";
import Payment from "../models/paymentModel.js";
import Renter from "../models/renterModel.js";
import {
    NotFoundError,
    ValidationError,
    ConflictError,
    ForbiddenError,
} from "../middlewares/errorHandler.js";
import { sendMail } from "../utils/mailer.js";
import { paymentConfirmedEmail } from "../utils/emailTemplates.js";
import { generateInvoicePdfBuffer } from "../utils/generateInvoicePdf.js";

const signaturesMatch = (expectedHex, providedHex) => {
    if (!expectedHex || !providedHex) return false;
    const expectedBuffer = Buffer.from(expectedHex, "hex");
    const providedBuffer = Buffer.from(providedHex, "hex");
    if (expectedBuffer.length !== providedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
};

const sendReceiptEmail = async (invoice, payment, renterDoc) => {
    if (!renterDoc?.email) return;
    const emailData = paymentConfirmedEmail(invoice, payment, renterDoc);
    const pdfFilename = `receipt-${invoice.period}-${invoice._id.toString().slice(-8)}.pdf`;

    try {
        const pdfBuffer = await generateInvoicePdfBuffer(invoice);
        await sendMail({
            to: renterDoc.email,
            ...emailData,
            attachments: [{ filename: pdfFilename, content: pdfBuffer, contentType: "application/pdf" }],
        });
    } catch (err) {
        console.error("[Mail] Payment receipt email failed:", err.message);
    }
};

const finalizePayment = async ({ invoice, transactionId, orderId, amount, paidAt }) => {
    const paidInvoice = await Invoice.findOneAndUpdate(
        {
            _id: invoice._id,
            isDeleted: false,
            status: { $ne: "paid" },
        },
        {
            $set: {
                status: "paid",
                paidAt,
            },
        },
        { new: true }
    );

    const payment = await Payment.findOneAndUpdate(
        { invoiceId: invoice._id, isDeleted: false },
        {
            $setOnInsert: {
                tenantId: invoice.tenantId,
                invoiceId: invoice._id,
                renterId: invoice.renter,
                amount,
                transactionId,
                orderId,
                status: "success",
                paidAt,
            },
        },
        { new: true, upsert: true }
    );

    if (payment.transactionId !== transactionId || payment.orderId !== orderId) {
        throw new ConflictError("Payment reference mismatch for invoice");
    }

    const finalInvoice = paidInvoice || (await Invoice.findById(invoice._id));
    return {
        invoice: finalInvoice,
        payment,
        invoiceStateChanged: Boolean(paidInvoice),
    };
};

// Lazy-init Razorpay instance to avoid crashing if keys aren't set during tests
const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay credentials are not configured in .env");
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

/**
 * POST /payments/create-order  (renter only)
 * Fetches invoice, verifies renter ownership, creates a Razorpay order,
 * saves orderId on invoice, and returns order details to the frontend.
 */
export const createOrder = async (req, res, next) => {
    try {
        const { invoiceId } = req.body;
        if (!invoiceId) throw new ValidationError("invoiceId is required");

        const renterDoc = await Renter.findOne({ user: req.user.id, tenantId: req.tenantId, isDeleted: false });
        if (!renterDoc) {
            throw new ForbiddenError("Only registered renters can create payment orders");
        }

        // Only the renter assigned to this invoice can pay it
        const invoice = await Invoice.findOne({
            _id: invoiceId,
            tenantId: req.tenantId,
            renter: renterDoc._id,
            status: { $in: ["pending", "overdue"] },
            isDeleted: false,
        });

        if (!invoice) {
            throw new NotFoundError(
                "Invoice not found, already paid, or access denied"
            );
        }

        // Idempotent create-order: if one already exists, return it for retry flow.
        if (invoice.razorpayOrderId) {
            return res.status(200).json({
                success: true,
                data: {
                    orderId: invoice.razorpayOrderId,
                    amount: invoice.amount * 100,
                    currency: "INR",
                    keyId: process.env.RAZORPAY_KEY_ID,
                    invoiceId: invoice._id,
                },
            });
        }

        const razorpay = getRazorpay();
        const order = await razorpay.orders.create({
            amount: invoice.amount * 100, // Razorpay expects paise
            currency: "INR",
            receipt: invoice._id.toString(),
        });

        // Persist orderId once so verify step can cross-check and retries reuse it.
        const persistedInvoice = await Invoice.findOneAndUpdate(
            {
                _id: invoice._id,
                tenantId: req.tenantId,
                renter: renterDoc._id,
                isDeleted: false,
                $or: [{ razorpayOrderId: { $exists: false } }, { razorpayOrderId: null }],
            },
            { $set: { razorpayOrderId: order.id } },
            { new: true }
        );

        const finalInvoice =
            persistedInvoice ||
            (await Invoice.findOne({
                _id: invoice._id,
                tenantId: req.tenantId,
                renter: renterDoc._id,
                isDeleted: false,
            }));

        if (!finalInvoice?.razorpayOrderId) {
            throw new ConflictError("Unable to finalize payment order for this invoice");
        }

        res.status(201).json({
            success: true,
            data: {
                orderId: finalInvoice.razorpayOrderId,
                amount: invoice.amount * 100,
                currency: "INR",
                keyId: process.env.RAZORPAY_KEY_ID,
                invoiceId: invoice._id,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /payments/verify  (renter only)
 * Verifies Razorpay HMAC signature. On success, marks invoice as paid
 * and creates an immutable Payment record.
 */
export const verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !invoiceId) {
            throw new ValidationError(
                "razorpay_order_id, razorpay_payment_id, razorpay_signature, and invoiceId are required"
            );
        }
        if (!process.env.RAZORPAY_KEY_SECRET) {
            throw new ValidationError("Razorpay secret is not configured");
        }

        // Cryptographic signature verification — never trust frontend payment confirmation
        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (!signaturesMatch(expected, razorpay_signature)) {
            throw new ValidationError("Invalid payment signature");
        }

        const renterDoc = await Renter.findOne({ user: req.user.id, tenantId: req.tenantId, isDeleted: false });
        if (!renterDoc) {
            throw new ForbiddenError("Only registered renters can verify payments");
        }

        // Confirm invoice belongs to this renter and matches the stored orderId
        const invoice = await Invoice.findOne({
            _id: invoiceId,
            tenantId: req.tenantId,
            renter: renterDoc._id,
            razorpayOrderId: razorpay_order_id,
        });

        // We check status explicitly to give better error messages
        if (!invoice) {
            throw new NotFoundError("Invoice not found or access denied");
        }
        if (invoice.isDeleted) {
            throw new NotFoundError("Invoice was deleted");
        }

        if (!["pending", "overdue", "paid"].includes(invoice.status)) {
            throw new ConflictError("Invoice is in an invalid state");
        }

        const wasPaid = invoice.status === "paid";
        const { invoice: paidInvoice, payment, invoiceStateChanged } = await finalizePayment({
            invoice,
            transactionId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: invoice.amount,
            paidAt: new Date(),
        });

        res.json({
            success: true,
            message: wasPaid
                ? "Payment already verified"
                : "Payment verified and invoice marked as paid",
            data: { payment },
        });

        if (!wasPaid && invoiceStateChanged) {
            void sendReceiptEmail(paidInvoice, payment, renterDoc);
        }
    } catch (err) {
        next(err);
    }
};

/**
 * GET /payments/history  (tenant sees all, renter sees own)
 */
export const getPaymentHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sort = "paidAt", order = "desc" } = req.query;
        const filter = { tenantId: req.tenantId, isDeleted: false };

        if (req.user.role === "renter") {
            const renterDoc = await Renter.findOne({ user: req.user.id, tenantId: req.tenantId, isDeleted: false });
            if (!renterDoc) {
                return res.json({ success: true, data: [], total: 0 });
            }
            filter.renterId = renterDoc._id;
        }

        const payments = await Payment.find(filter)
            .populate("invoiceId", "amount period status")
            .populate("renterId", "name email")
            .sort({ [sort]: order === "asc" ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Payment.countDocuments(filter);

        res.json({ success: true, data: payments, total });
    } catch (err) {
        next(err);
    }
};
/**
 * POST /payments/webhook  — called directly by Razorpay, no auth middleware
 * IMPORTANT: Must receive the RAW body (registered before express.json()).
 * Uses a separate RAZORPAY_WEBHOOK_SECRET set in the Razorpay dashboard.
 *
 * Handles:
 *   payment.captured → mark invoice paid + create Payment record (fallback for closed-browser cases)
 *   payment.failed   → log for visibility (invoice stays pending/overdue)
 */
export const handleWebhook = async (req, res, next) => {
    try {
        const signature = req.headers["x-razorpay-signature"];

        if (!signature) {
            return res.status(400).json({ success: false, message: "Missing webhook signature" });
        }
        if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
            return res.status(500).json({ success: false, message: "Webhook secret is not configured" });
        }

        // Verify using the raw body buffer — JSON.parse would break the HMAC
        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(req.body) // req.body is a Buffer here (express.raw middleware)
            .digest("hex");

        if (!signaturesMatch(expected, signature)) {
            return res.status(400).json({ success: false, message: "Invalid webhook signature" });
        }

        const event = JSON.parse(req.body.toString());
        const paymentEntity = event?.payload?.payment?.entity;

        if (event.event === "payment.captured" && paymentEntity) {
            const { id: transactionId, order_id: orderId, amount } = paymentEntity;

            if (!transactionId || !orderId) {
                return res.json({ success: true });
            }

            // Find invoice by the stored razorpayOrderId
            const invoice = await Invoice.findOne({
                razorpayOrderId: orderId,
                isDeleted: false,
            });

            if (invoice) {
                if (!["pending", "overdue", "paid"].includes(invoice.status)) {
                    return res.json({ success: true });
                }

                const wasPaid = invoice.status === "paid";
                const { invoice: paidInvoice, payment, invoiceStateChanged } = await finalizePayment({
                    invoice,
                    transactionId,
                    orderId,
                    amount: Number(amount) / 100,
                    paidAt: new Date(),
                });

                if (!wasPaid && invoiceStateChanged) {
                    const renterDoc = await Renter.findById(invoice.renter).select("name email");
                    void sendReceiptEmail(paidInvoice, payment, renterDoc);
                }

                console.log(`[Webhook] payment.captured — invoice ${invoice._id} processed.`);
            }
        }

        if (event.event === "payment.failed") {
            console.warn(`[Webhook] payment.failed — order: ${paymentEntity?.order_id}`);
            // Invoice stays pending/overdue — renter can retry
        }

        // Razorpay expects a 200 quickly; always acknowledge
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};
