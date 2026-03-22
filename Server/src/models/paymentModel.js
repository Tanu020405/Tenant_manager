import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        tenantId: { type: String, required: true, index: true },
        invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true },
        renterId: { type: mongoose.Schema.Types.ObjectId, ref: "Renter", required: true },
        amount: { type: Number, required: true },
        paymentGateway: { type: String, default: "razorpay" },
        transactionId: { type: String, required: true }, // razorpay_payment_id
        orderId: { type: String, required: true },        // razorpay_order_id
        status: { type: String, enum: ["success", "failed"], default: "success" },
        paidAt: { type: Date, default: Date.now },
        isDeleted: { type: Boolean, default: false, index: true },
    },
    { timestamps: true }
);

paymentSchema.index({ tenantId: 1, renterId: 1 });
paymentSchema.index({ invoiceId: 1 }, { unique: true });    // one payment per invoice
paymentSchema.index({ transactionId: 1 }, { unique: true }); // one record per razorpay payment_id

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
