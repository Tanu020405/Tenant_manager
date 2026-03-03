import Invoice from "../models/invoiceModel.js";
import Property from "../models/propertyModel.js";
import Renter from "../models/renterModel.js";
import { NotFoundError, ValidationError, ConflictError } from "../middlewares/errorHandler.js";

// Generate monthly invoice for a renter and property
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
    // Calculate due date: last day of the period month
    const [year, month] = period.split("-").map(Number);
    const dueDate = new Date(year, month, 0); // last day of month
    // Check for existing invoice for this period
    const existing = await Invoice.findOne({ property: propertyId, renter: renterId, period, tenantId: req.tenantId, isDeleted: false });
    if (existing) {
      throw new ConflictError("Invoice already exists for this period");
    }
    const invoice = await Invoice.create({
      property: propertyId,
      renter: renterId,
      tenantId: req.tenantId,
      amount: property.rent,
      dueDate,
      period,
    });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

// List invoices (with filtering, pagination, sorting)
export const getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "createdAt", order = "desc", paid, renter, property, period } = req.query;
    const filter = { tenantId: req.tenantId, isDeleted: false };
    if (paid !== undefined) filter.paid = paid === "true";
    if (renter) filter.renter = renter;
    if (property) filter.property = property;
    if (period) filter.period = period;
    // If user is a tenant, only show their invoices
    if (req.user?.role === "tenant") {
      filter.renter = req.user.id;
    }
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

// Mark invoice as paid
export const payInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, isDeleted: false },
      { paid: true, paidAt: new Date() },
      { new: true }
    );
    if (!invoice) {
      throw new NotFoundError("Invoice not found");
    }
    res.json({ success: true, data: invoice, message: "Invoice marked as paid" });
  } catch (err) {
    next(err);
  }
};

// Delete invoice (soft delete)
export const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!invoice) {
      throw new NotFoundError("Invoice not found");
    }
    res.json({ success: true, data: invoice, message: "Invoice deleted successfully" });
  } catch (err) {
    next(err);
  }
};
