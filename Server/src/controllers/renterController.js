import Renter from "../models/renterModel.js";
import { NotFoundError, ValidationError } from "../middlewares/errorHandler.js";

// Get all renters (with filtering, pagination, sorting)
export const getRenters = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "createdAt", order = "desc", name, active } = req.query;
    const filter = { tenantId: req.tenantId, isDeleted: false };
    if (name) filter.name = { $regex: name, $options: "i" };
    if (active !== undefined) filter.active = active === "true";

    const renters = await Renter.find(filter)
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
    const renter = await Renter.findOne({ _id: req.params.id, tenantId: req.tenantId, isDeleted: false });
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

    const renter = await Renter.create({ ...req.body, tenantId: req.tenantId });
    res.status(201).json({ success: true, data: renter });
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
    res.json({ success: true, data: renter, message: "Renter deleted successfully" });
  } catch (err) {
    next(err);
  }
};
