import express from "express";
import { registerUser, loginUser, forgotPassword, resetPassword } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import User from "../models/userModel.js";
import Tenant from "../models/tenantModel.js";
import { NotFoundError, ValidationError } from "../middlewares/errorHandler.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/me", verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user || user.isDeleted) {
      throw new NotFoundError("User not found");
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

router.get("/tenant/profile", verifyToken, async (req, res, next) => {
  try {
    const tenant = await Tenant.findOne({ tenantId: req.user.tenantId, isDeleted: false });
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

router.put("/tenant/profile", verifyToken, async (req, res, next) => {
  try {
    const { name, logoUrl, theme } = req.body;
    const tenant = await Tenant.findOne({ tenantId: req.user.tenantId, isDeleted: false });
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }

    if (name !== undefined && !String(name).trim()) {
      throw new ValidationError("Workspace name cannot be empty");
    }

    if (name) {
      tenant.name = String(name).trim();
    }
    if (logoUrl !== undefined) tenant.assets = { ...tenant.assets, logoUrl };
    if (theme) {
      const allowedThemeFields = [
        "primary",
        "accent",
        "background",
        "surface",
        "text",
        "muted",
        "primaryContainer",
        "onSurface",
        "onSurfaceVariant",
        "secondary",
        "tertiary",
        "error",
      ];
      const filteredTheme = Object.fromEntries(
        Object.entries(theme).filter(([key]) => allowedThemeFields.includes(key))
      );
      tenant.theme = { ...tenant.theme.toObject(), ...filteredTheme };
    }

    await tenant.save();
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

export default router;

