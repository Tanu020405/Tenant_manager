import Renter from "../models/renterModel.js";
import User from "../models/userModel.js";
import { NotFoundError, ValidationError, ConflictError } from "../middlewares/errorHandler.js";

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
    const { name, email, phone } = req.body;

    if (!name || !email) {
      throw new ValidationError("Name and email are required");
    }

    // Provision a User account for the renter so they can log in
    const existingUser = await User.findOne({ email, tenantId: req.tenantId, isDeleted: false });
    if (existingUser) {
      throw new ConflictError("A user with this email already exists in this workspace.");
    }

    // Default password for newly created renters. In a real app, send an email to set password.
    const defaultPassword = "password123";
    const newUser = await User.create({
      name,
      email,
      password: defaultPassword,
      tenantId: req.tenantId,
      role: "renter"
    });

    const renter = await Renter.create({
      ...req.body,
      tenantId: req.tenantId,
      user: newUser._id
    });

    res.status(201).json({ success: true, data: renter, defaultPassword });
  } catch (err) {
    next(err);
  }
};

// Update renter
export const updateRenter = async (req, res, next) => {
  try {
    const renter = await Renter.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, isDeleted: false },
      req.body,
      { new: true }
    );
    if (!renter) {
      throw new NotFoundError("Renter not found");
    }
    res.json({ success: true, data: renter });
  } catch (err) {
    next(err);
  }
};

// Delete renter (soft delete)
export const deleteRenter = async (req, res, next) => {
  try {
    const renter = await Renter.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!renter) {
      throw new NotFoundError("Renter not found");
    }

    // Also soft-delete their associated user record so they lose login access
    if (renter.user) {
      await User.findByIdAndUpdate(renter.user, { isDeleted: true, deletedAt: new Date() });
    }
    res.json({ success: true, data: renter, message: "Renter deleted successfully" });
  } catch (err) {
    next(err);
  }
};
