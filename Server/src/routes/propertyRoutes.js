import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { tenantResolver } from "../middlewares/tenantResolver.js";
import { requireRole, requireAnyRole } from "../middlewares/requireRole.js";
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../controllers/propertyController.js";

const router = express.Router({ mergeParams: true });

router.use(verifyToken);
router.use(tenantResolver);

// Both admin and tenant can view properties
router.get("/", requireAnyRole(["admin", "tenant"]), getProperties);
router.get("/:id", requireAnyRole(["admin", "tenant"]), getProperty);

// Only admin can create, update, or delete properties
router.post("/", requireRole("admin"), createProperty);
router.put("/:id", requireRole("admin"), updateProperty);
router.delete("/:id", requireRole("admin"), deleteProperty);

export default router;
