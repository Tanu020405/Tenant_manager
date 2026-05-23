import mongoose from "mongoose";

const themeSchema = new mongoose.Schema(
  {
    primary: { type: String, default: "#1f2937" },
    accent: { type: String, default: "#2563eb" },
    background: { type: String, default: "#f8fafc" },
    surface: { type: String, default: "#ffffff" },
    text: { type: String, default: "#111827" },
    muted: { type: String, default: "#6b7280" },
  },
  { _id: false }
);

const tenantSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    theme: { type: themeSchema, default: () => ({}) },
    assets: {
      logoUrl: { type: String },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
