import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    renter: { type: mongoose.Schema.Types.ObjectId, ref: "Renter", required: true },
    tenantId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },        // actual invoice amount (used by payment gateway)
    rentSnapshot: { type: Number, required: true },   // rent at time of invoice creation
    propertySnapshot: {
      name: { type: String },
      address: { type: String },
    },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["pending", "paid", "overdue"], default: "pending", index: true },
    paidAt: { type: Date },
    razorpayOrderId: { type: String },
    period: { type: String, required: true }, // e.g. "2026-03" for March 2026
    notes: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Prevents duplicate invoices: one invoice per renter per property per billing period.
// property is intentionally included — a renter can rent multiple properties
// and should receive separate invoices for each.
invoiceSchema.index({ tenantId: 1, renter: 1, property: 1, period: 1 }, { unique: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
