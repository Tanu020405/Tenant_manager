import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { tenantResolver } from "../middlewares/tenantResolver.js";
import { requireRole, requireAnyRole } from "../middlewares/requireRole.js";
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

// Both admin and tenant can view renters
router.get("/", requireAnyRole(["admin", "tenant"]), getRenters);
router.get("/:id", requireAnyRole(["admin", "tenant"]), getRenter);

// Only admin can create, update, or delete renters
router.post("/", requireRole("admin"), createRenter);
router.put("/:id", requireRole("admin"), updateRenter);
router.delete("/:id", requireRole("admin"), deleteRenter);

export default router;
