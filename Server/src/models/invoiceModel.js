import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    renter: { type: mongoose.Schema.Types.ObjectId, ref: "Renter", required: true },
    tenantId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date },
    period: { type: String, required: true }, // e.g. "2026-03" for March 2026
    notes: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

invoiceSchema.index({ tenantId: 1, renter: 1, period: 1 }, { unique: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
