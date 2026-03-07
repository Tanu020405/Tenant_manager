import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { tenantResolver } from "../middlewares/tenantResolver.js";
import { requireRole } from "../middlewares/requireRole.js";
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

// All property operations are tenant-only
router.get("/", requireRole("tenant"), getProperties);
router.get("/:id", requireRole("tenant"), getProperty);
router.post("/", requireRole("tenant"), createProperty);
router.put("/:id", requireRole("tenant"), updateProperty);
router.delete("/:id", requireRole("tenant"), deleteProperty);

export default router;
