import crypto from "crypto";
import Renter from "../models/renterModel.js";
import User from "../models/userModel.js";
import Property from "../models/propertyModel.js";
import { NotFoundError, ValidationError, ConflictError } from "../middlewares/errorHandler.js";
import { sendMail } from "../utils/mailer.js";

const getClientBaseUrl = () => process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";

const sanitizeRenterPayload = (payload) => {
  const sanitized = {};
  const allowedFields = ["name", "email", "phone", "property", "active", "leaseStartDate"];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }

  if (sanitized.name !== undefined) sanitized.name = String(sanitized.name).trim();
  if (sanitized.email !== undefined) sanitized.email = String(sanitized.email).trim().toLowerCase();
  if (sanitized.phone !== undefined) sanitized.phone = String(sanitized.phone).trim();
  if (sanitized.leaseStartDate !== undefined) sanitized.leaseStartDate = new Date(sanitized.leaseStartDate);

  return sanitized;
};

const assertPropertyBelongsToTenant = async (propertyId, tenantId) => {
  if (!propertyId) return null;
  const property = await Property.findOne({ _id: propertyId, tenantId, isDeleted: false });
  if (!property) {
    throw new ValidationError("Assigned property was not found in this tenant");
  }
  return property;
};

// Get all renters (with filtering, pagination, sorting)
export const getRenters = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "createdAt", order = "desc", name, active } = req.query;
    const filter = { tenantId: req.tenantId, isDeleted: false };
    if (name) filter.name = { $regex: name, $options: "i" };
    if (active !== undefined) filter.active = active === "true";

    const renters = await Renter.find(filter)
      .populate("property")
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Renter.countDocuments(filter);
    res.json({ success: true, data: renters, total });
  } catch (err) {
    next(err);
  }
};

// Get single renter
export const getRenter = async (req, res, next) => {
  try {
    const renter = await Renter.findOne({ _id: req.params.id, tenantId: req.tenantId, isDeleted: false }).populate("property");
    if (!renter) {
      throw new NotFoundError("Renter not found");
    }
    res.json({ success: true, data: renter });
  } catch (err) {
    next(err);
  }
};

// Create renter
export const createRenter = async (req, res, next) => {
  try {
    const payload = sanitizeRenterPayload(req.body);
    const { name, email } = payload;

    if (!name || !email) {
      throw new ValidationError("Name and email are required");
    }

    if (payload.property) {
      await assertPropertyBelongsToTenant(payload.property, req.tenantId);
    }

    const existingRenter = await Renter.findOne({ email, isDeleted: false });
    if (existingRenter) {
      throw new ConflictError("A renter with this email already exists in this workspace.");
    }

    // Provision a User account for the renter so they can log in
    const existingUser = await User.findOne({ email, isDeleted: false });
    if (existingUser) {
      throw new ConflictError("A user with this email already exists in this workspace.");
    }

    const temporaryPassword = crypto.randomBytes(24).toString("hex");
    const newUser = await User.create({
      name,
      email,
      password: temporaryPassword,
      tenantId: req.tenantId,
      role: "renter",
    });

    const resetToken = newUser.createPasswordResetToken();
    await newUser.save({ validateBeforeSave: false });

    const renter = await Renter.create({
      ...payload,
      tenantId: req.tenantId,
      user: newUser._id,
    });

    if (payload.property) {
      await Property.findOneAndUpdate(
        { _id: payload.property, tenantId: req.tenantId, isDeleted: false },
        { currentRenter: renter._id, available: false }
      );
    }

    const resetUrl = `${getClientBaseUrl()}/reset-password/${resetToken}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937;">You're invited to PropConnect</h2>
        <p style="color: #4b5563;">Your renter account has been created. Set your password using the secure link below:</p>
        <a href="${resetUrl}" style="display:inline-block; margin-top: 15px; margin-bottom: 20px; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Set Password</a>
        <p style="color: #6b7280; font-size: 13px;">This link expires in 1 hour.</p>
      </div>
    `;

    sendMail({ to: email, subject: "Complete your renter account setup", html })
      .catch((mailErr) => console.error("[Mail] Renter invite failed:", mailErr.message));

    res.status(201).json({ success: true, data: renter });
  } catch (err) {
    next(err);
  }
};

// Update renter
export const updateRenter = async (req, res, next) => {
  try {
    const renter = await Renter.findOne({ _id: req.params.id, tenantId: req.tenantId, isDeleted: false });
    if (!renter) {
      throw new NotFoundError("Renter not found");
    }

    const payload = sanitizeRenterPayload(req.body);
    if (!Object.keys(payload).length) {
      throw new ValidationError("At least one editable field is required");
    }

    if (payload.email && payload.email !== renter.email) {
      const duplicateRenter = await Renter.findOne({
        _id: { $ne: renter._id },
        email: payload.email,
        isDeleted: false,
      });
      if (duplicateRenter) {
        throw new ConflictError("A renter with this email already exists in this workspace.");
      }

      const duplicateUser = await User.findOne({
        _id: { $ne: renter.user },
        email: payload.email,
        isDeleted: false,
      });
      if (duplicateUser) {
        throw new ConflictError("A user with this email already exists in this workspace.");
      }
    }

    const oldPropertyId = renter.property?.toString() || null;
    const nextPropertyId = payload.property !== undefined ? (payload.property || null) : oldPropertyId;

    if (nextPropertyId) {
      await assertPropertyBelongsToTenant(nextPropertyId, req.tenantId);
    }

    Object.assign(renter, payload);
    await renter.save();

    if (oldPropertyId && oldPropertyId !== nextPropertyId) {
      await Property.findOneAndUpdate(
        { _id: oldPropertyId, tenantId: req.tenantId, isDeleted: false, currentRenter: renter._id },
        { currentRenter: null, available: true }
      );
    }

    if (nextPropertyId) {
      await Property.findOneAndUpdate(
        { _id: nextPropertyId, tenantId: req.tenantId, isDeleted: false },
        { currentRenter: renter._id, available: false }
      );
    }

    if (renter.user && (payload.name || payload.email)) {
      const userPatch = {};
      if (payload.name) userPatch.name = payload.name;
      if (payload.email) userPatch.email = payload.email;
      await User.findOneAndUpdate(
        { _id: renter.user, tenantId: req.tenantId, isDeleted: false },
        userPatch
      );
    }

    res.json({ success: true, data: renter });
  } catch (err) {
    next(err);
  }
};

// Delete renter (soft delete)
export const deleteRenter = async (req, res, next) => {
  try {
    const renter = await Renter.findOne({ _id: req.params.id, tenantId: req.tenantId, isDeleted: false });
    if (!renter) {
      throw new NotFoundError("Renter not found");
    }

    renter.isDeleted = true;
    renter.deletedAt = new Date();
    renter.active = false;
    await renter.save();

    if (renter.property) {
      await Property.findOneAndUpdate(
        { _id: renter.property, tenantId: req.tenantId, isDeleted: false, currentRenter: renter._id },
        { currentRenter: null, available: true }
      );
    }

    // Also soft-delete their associated user record so they lose login access
    if (renter.user) {
      await User.findOneAndUpdate(
        { _id: renter.user, tenantId: req.tenantId, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() }
      );
    }
    res.json({ success: true, data: renter, message: "Renter deleted successfully" });
  } catch (err) {
    next(err);
  }
};
