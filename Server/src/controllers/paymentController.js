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
            status: "pending",
            isDeleted: false,
        });

        if (!invoice) {
            throw new NotFoundError(
                "Invoice not found, already paid, or access denied"
            );
        }

        // Check no existing Razorpay order already created
        if (invoice.razorpayOrderId) {
            throw new ConflictError(
                "A payment order already exists for this invoice"
            );
        }

        const razorpay = getRazorpay();
        const order = await razorpay.orders.create({
            amount: invoice.amount * 100, // Razorpay expects paise
            currency: "INR",
            receipt: invoice._id.toString(),
        });

        // Persist orderId on invoice so verify step can cross-check
        invoice.razorpayOrderId = order.id;
        await invoice.save();

        res.status(201).json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
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

        // Cryptographic signature verification — never trust frontend payment confirmation
        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expected !== razorpay_signature) {
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

        // Race Condition Handling: Webhooks may mark it before frontend verified
        if (invoice.status === "paid") {
            return res.json({
                success: true,
                message: "Payment verified and invoice marked as paid (webhook fallback)",
            });
        }

        if (invoice.status !== "pending") {
            throw new ConflictError("Invoice is in an invalid state");
        }

        // Mark invoice as paid
        invoice.status = "paid";
        invoice.paidAt = new Date();
        await invoice.save();

        // Create payment record
        const payment = await Payment.create({
            tenantId: req.tenantId,
            invoiceId: invoice._id,
            renterId: renterDoc._id,
            amount: invoice.amount,
            transactionId: razorpay_payment_id,
            orderId: razorpay_order_id,
            status: "success",
            paidAt: new Date(),
        });

        res.json({
            success: true,
            message: "Payment verified and invoice marked as paid",
            data: { payment },
        });
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

        // Verify using the raw body buffer — JSON.parse would break the HMAC
        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(req.body) // req.body is a Buffer here (express.raw middleware)
            .digest("hex");

        if (expected !== signature) {
            return res.status(400).json({ success: false, message: "Invalid webhook signature" });
        }

        const event = JSON.parse(req.body.toString());
        const paymentEntity = event?.payload?.payment?.entity;

        if (event.event === "payment.captured" && paymentEntity) {
            const { id: transactionId, order_id: orderId, amount } = paymentEntity;

            // Find invoice by the stored razorpayOrderId
            const invoice = await Invoice.findOne({
                razorpayOrderId: orderId,
                status: "pending",
                isDeleted: false,
            });

            if (invoice) {
                // Mark invoice paid (idempotent — won't double-mark if /verify already ran)
                invoice.status = "paid";
                invoice.paidAt = new Date();
                await invoice.save();

                // Create payment record only if it doesn't already exist
                const exists = await Payment.findOne({ orderId });
                if (!exists) {
                    await Payment.create({
                        tenantId: invoice.tenantId,
                        invoiceId: invoice._id,
                        renterId: invoice.renter,
                        amount: amount / 100, // Razorpay sends paise
                        transactionId,
                        orderId,
                        status: "success",
                        paidAt: new Date(),
                    });
                }

                console.log(`[Webhook] payment.captured — invoice ${invoice._id} marked paid.`);
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
