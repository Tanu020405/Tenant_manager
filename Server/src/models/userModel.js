import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    tenantId: { type: String, required: true, index: true },
    role: { type: String, enum: ["superAdmin", "tenant", "renter"], default: "tenant" },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export default User;
