import Invoice from "../models/invoiceModel.js";
import Property from "../models/propertyModel.js";
import Renter from "../models/renterModel.js";
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from "../middlewares/errorHandler.js";

// Generate monthly invoice for a renter and property (tenant only)
export const generateInvoice = async (req, res, next) => {
  try {
    const { renterId, propertyId, period } = req.body;
    if (!renterId || !propertyId || !period) {
      throw new ValidationError("renterId, propertyId, and period are required");
    }
    const property = await Property.findOne({ _id: propertyId, tenantId: req.tenantId, isDeleted: false });
    const renter = await Renter.findOne({ _id: renterId, tenantId: req.tenantId, isDeleted: false });
    if (!property || !renter) {
      throw new NotFoundError("Property or Renter not found");
    }
    const [year, month] = period.split("-").map(Number);
    const dueDate = new Date(year, month, 0); // last day of month
    const existing = await Invoice.findOne({ property: propertyId, renter: renterId, period, tenantId: req.tenantId, isDeleted: false });
    if (existing) {
      throw new ConflictError("Invoice already exists for this period");
    }
    const invoice = await Invoice.create({
      property: propertyId,
      renter: renterId,
      tenantId: req.tenantId,
      amount: property.rent,
      rentSnapshot: property.rent,             // frozen rent at invoice creation
      propertySnapshot: {                      // frozen property name/address
        name: property.name,
        address: property.address,
      },
      dueDate,
      period,
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

// List all invoices for a tenant (tenant only)
export const getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "createdAt", order = "desc", status, renter, property, period } = req.query;
    const filter = { tenantId: req.tenantId, isDeleted: false };
    if (status) filter.status = status;
    if (renter) filter.renter = renter;
    if (property) filter.property = property;
    if (period) filter.period = period;

    const invoices = await Invoice.find(filter)
      .populate("property renter")
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Invoice.countDocuments(filter);
    res.json({ success: true, data: invoices, total });
  } catch (err) {
    next(err);
  }
};

// List invoices for the authenticated renter (renter only — own invoices only)
export const getMyInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "createdAt", order = "desc", status, period } = req.query;
    const renterDoc = await Renter.findOne({ user: req.user.id, tenantId: req.tenantId, isDeleted: false });
    if (!renterDoc) {
      return res.json({ success: true, data: [], total: 0 });
    }

    const filter = {
      tenantId: req.tenantId,
      renter: renterDoc._id,
      isDeleted: false,
    };
    if (status) filter.status = status;
    if (period) filter.period = period;

    const invoices = await Invoice.find(filter)
      .populate("property")
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Invoice.countDocuments(filter);
    res.json({ success: true, data: invoices, total });
  } catch (err) {
    next(err);
  }
};

// Delete invoice — forbidden for all roles (financial audit trail must be preserved)
export const deleteInvoice = (_req, _res, next) => {
  return next(new ForbiddenError("Invoices cannot be deleted"));
};
