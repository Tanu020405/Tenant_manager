import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { tenantResolver } from "../middlewares/tenantResolver.js";
import { requireRole } from "../middlewares/requireRole.js";
import {
  generateInvoice,
  getInvoices,
  getMyInvoices,
  deleteInvoice,
  downloadInvoicePdf,
} from "../controllers/invoiceController.js";

const router = express.Router({ mergeParams: true });

router.use(verifyToken);
router.use(tenantResolver);

// tenant: generate and view all invoices under their account
router.post("/generate", requireRole("tenant"), generateInvoice);
router.get("/", requireRole("tenant"), getInvoices);

// renter: view own invoices
router.get("/my-invoices", requireRole("renter"), getMyInvoices);

// delete is forbidden for all roles (audit trail preserved)
router.delete("/:id", deleteInvoice);

// PDF download — tenant (any invoice), renter (own only)
router.get("/:id/pdf", requireRole("tenant", "renter"), downloadInvoicePdf);

export default router;
