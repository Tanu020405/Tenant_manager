import Property from "../models/propertyModel.js";
import { NotFoundError, ValidationError } from "../middlewares/errorHandler.js";

const sanitizePropertyPayload = (payload) => {
  const sanitized = {};
  const allowedFields = ["name", "address", "rent", "available", "description", "features", "currentRenter"];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }

  if (sanitized.name !== undefined) sanitized.name = String(sanitized.name).trim();
  if (sanitized.address !== undefined) sanitized.address = String(sanitized.address).trim();
  if (sanitized.rent !== undefined) sanitized.rent = Number(sanitized.rent);
  if (sanitized.features !== undefined && !Array.isArray(sanitized.features)) {
    throw new ValidationError("features must be an array");
  }

  return sanitized;
};

// Get all properties (with filtering, pagination, sorting)
export const getProperties = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "createdAt", order = "desc", minRent, maxRent, available, name } = req.query;
    const filter = { tenantId: req.tenantId, isDeleted: false };
    if (minRent) filter.rent = { ...filter.rent, $gte: Number(minRent) };
    if (maxRent) filter.rent = { ...filter.rent, $lte: Number(maxRent) };
    if (available !== undefined) filter.available = available === "true";
    if (name) filter.name = { $regex: name, $options: "i" };

    const properties = await Property.find(filter)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Property.countDocuments(filter);
    res.json({ success: true, data: properties, total });
  } catch (err) {
    next(err);
  }
};

// Get single property
export const getProperty = async (req, res, next) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, tenantId: req.tenantId, isDeleted: false });
    if (!property) {
      throw new NotFoundError("Property not found");
    }
    res.json({ success: true, data: property });
  } catch (err) {
    next(err);
  }
};

// Create property
export const createProperty = async (req, res, next) => {
  try {
    const payload = sanitizePropertyPayload(req.body);
    const { name, address, rent } = payload;

    if (!name || !address || !Number.isFinite(rent) || rent <= 0) {
      throw new ValidationError("Name, address, and rent are required");
    }

    const property = await Property.create({ ...payload, tenantId: req.tenantId });
    res.status(201).json({ success: true, data: property });
  } catch (err) {
    next(err);
  }
};

// Update property
export const updateProperty = async (req, res, next) => {
  try {
    const payload = sanitizePropertyPayload(req.body);
    if (!Object.keys(payload).length) {
      throw new ValidationError("At least one editable field is required");
    }

    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, isDeleted: false },
      payload,
      { new: true }
    );
    if (!property) {
      throw new NotFoundError("Property not found");
    }
    res.json({ success: true, data: property });
  } catch (err) {
    next(err);
  }
};

// Delete property (soft delete)
export const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!property) {
      throw new NotFoundError("Property not found");
    }
    res.json({ success: true, data: property, message: "Property deleted successfully" });
  } catch (err) {
    next(err);
  }
};
