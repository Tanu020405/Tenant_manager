import express from "express";
import { getPosts, createPost, deletePost } from "../controllers/resourcecontroller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { tenantResolver } from "../middlewares/tenantResolver.js";
import { requireRole, requireAnyRole } from "../middlewares/requireRole.js";

const router = express.Router({ mergeParams: true });

router.use(verifyToken);
router.use(tenantResolver);

// Both admin and tenant can view posts
router.get("/", requireAnyRole(["admin", "tenant"]), getPosts);

// Only admin can create or delete posts
router.post("/", requireRole("admin"), createPost);
router.delete("/:id", requireRole("admin"), deletePost);

export default router;
