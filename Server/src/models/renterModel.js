import mongoose from "mongoose";

const renterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    tenantId: { type: String, required: true, index: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    active: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

renterSchema.index({ tenantId: 1, email: 1 }, { unique: true });

const Renter = mongoose.model("Renter", renterSchema);
export default Renter;
