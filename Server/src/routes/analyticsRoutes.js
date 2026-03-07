import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { tenantResolver } from "../middlewares/tenantResolver.js";
import { requireRole } from "../middlewares/requireRole.js";
import {
    getRevenue,
    getPendingInvoices,
    getOverdueInvoices,
} from "../controllers/analyticsController.js";

const router = express.Router({ mergeParams: true });

router.use(verifyToken);
router.use(tenantResolver);

// All analytics endpoints are tenant-only
router.get("/revenue", requireRole("tenant"), getRevenue);
router.get("/pending", requireRole("tenant"), getPendingInvoices);
router.get("/overdue", requireRole("tenant"), getOverdueInvoices);

export default router;
