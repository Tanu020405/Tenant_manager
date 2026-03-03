import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    rent: { type: Number, required: true },
    available: { type: Boolean, default: true },
    tenantId: { type: String, required: true, index: true },
    currentRenter: { type: mongoose.Schema.Types.ObjectId, ref: "Renter" },
    description: { type: String },
    features: [{ type: String }],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

propertySchema.index({ tenantId: 1, name: 1 }, { unique: true });

const Property = mongoose.model("Property", propertySchema);
export default Property;
