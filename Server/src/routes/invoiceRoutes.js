import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { tenantResolver } from "../middlewares/tenantResolver.js";
import { requireRole, requireAnyRole } from "../middlewares/requireRole.js";
import {
  generateInvoice,
  getInvoices,
  payInvoice,
  deleteInvoice,
} from "../controllers/invoiceController.js";

const router = express.Router({ mergeParams: true });

router.use(verifyToken);
router.use(tenantResolver);

// Only admin can generate, pay, or delete invoices
router.post("/generate", requireRole("admin"), generateInvoice);
router.patch("/:id/pay", requireRole("admin"), payInvoice);
router.delete("/:id", requireRole("admin"), deleteInvoice);
// Both admin and tenant can view invoices, but tenant can only see their own
router.get("/", requireAnyRole(["admin", "tenant"]), getInvoices);

export default router;
