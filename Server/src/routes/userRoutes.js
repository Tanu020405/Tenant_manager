import express from "express";
import { registerUser, loginUser, forgotPassword, resetPassword } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import User from "../models/userModel.js";
import Tenant from "../models/tenantModel.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/tenant/profile", verifyToken, async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ tenantId: req.user.tenantId });
    if (!tenant) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }
    res.json({ success: true, data: tenant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/tenant/profile", verifyToken, async (req, res) => {
  try {
    const { name, logoUrl, theme } = req.body;
    const tenant = await Tenant.findOne({ tenantId: req.user.tenantId, isDeleted: false });
    if (!tenant) return res.status(404).json({ success: false, message: "Tenant not found" });

    if (name)    tenant.name = name;
    if (logoUrl !== undefined) tenant.assets = { ...tenant.assets, logoUrl };
    if (theme)   tenant.theme = { ...tenant.theme.toObject(), ...theme };

    await tenant.save();
    res.json({ success: true, data: tenant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

