import Invoice from "../models/invoiceModel.js";
import Property from "../models/propertyModel.js";
import Renter from "../models/renterModel.js";
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from "../middlewares/errorHandler.js";
import { createInvoicePdfStream, generateInvoicePdfBuffer } from "../utils/generateInvoicePdf.js";
import { sendMail } from "../utils/mailer.js";
import { invoiceGeneratedEmail } from "../utils/emailTemplates.js";

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

    // Fire-and-forget — email renter with invoice PDF attached
    const invoiceObj = { ...invoice.toObject(), propertySnapshot: { name: property.name, address: property.address } };
    const email = invoiceGeneratedEmail(invoiceObj, renter);
    generateInvoicePdfBuffer(invoiceObj)
      .then((pdfBuffer) => {
        return sendMail({
          to: renter.email,
          ...email,
          attachments: [{
            filename: `invoice-${period}-${invoice._id.toString().slice(-8)}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          }],
        });
      })
      .catch((err) => console.error("[Mail] Invoice email failed:", err.message));
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

// Download invoice as PDF (tenant sees any; renter sees own only)
export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filter = { _id: id, tenantId: req.tenantId, isDeleted: false };

    // Renters can only fetch their own invoices
    if (req.user.role === "renter") {
      const renterDoc = await Renter.findOne({ user: req.user.id, tenantId: req.tenantId, isDeleted: false });
      if (!renterDoc) throw new ForbiddenError("Renter profile not found");
      filter.renter = renterDoc._id;
    }

    const invoice = await Invoice.findOne(filter).populate("renter", "name email phone");
    if (!invoice) throw new NotFoundError("Invoice not found or access denied");

    const filename = `invoice-${invoice.period}-${invoice._id.toString().slice(-8)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    const pdfStream = createInvoicePdfStream(invoice);
    pdfStream.on("error", (err) => {
      console.error("[PDF] Stream error:", err.message);
      res.end(); // close cleanly — headers already sent, can't send JSON error
    });
    pdfStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

// Delete invoice — forbidden for all roles (financial audit trail must be preserved)
export const deleteInvoice = (_req, _res, next) => {
  return next(new ForbiddenError("Invoices cannot be deleted"));
};
