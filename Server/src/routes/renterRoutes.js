import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { tenantResolver } from "../middlewares/tenantResolver.js";
import { requireRole } from "../middlewares/requireRole.js";
import {
  getRenters,
  getRenter,
  createRenter,
  updateRenter,
  deleteRenter,
} from "../controllers/renterController.js";

const router = express.Router({ mergeParams: true });

router.use(verifyToken);
router.use(tenantResolver);

// All renter management is tenant-only
router.get("/", requireRole("tenant"), getRenters);
router.get("/:id", requireRole("tenant"), getRenter);
router.post("/", requireRole("tenant"), createRenter);
router.put("/:id", requireRole("tenant"), updateRenter);
router.delete("/:id", requireRole("tenant"), deleteRenter);

export default router;
