import express from "express";
import { getPosts, createPost, deletePost } from "../controllers/resourcecontroller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { tenantResolver } from "../middlewares/tenantResolver.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = express.Router({ mergeParams: true });

router.use(verifyToken);
router.use(tenantResolver);

// All post operations are tenant-only
router.get("/", requireRole("tenant"), getPosts);
router.post("/", requireRole("tenant"), createPost);
router.delete("/:id", requireRole("tenant"), deletePost);

export default router;
