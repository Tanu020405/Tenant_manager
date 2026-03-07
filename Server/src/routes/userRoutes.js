import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import User from "../models/userModel.js";
import Tenant from "../models/tenantModel.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

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

export default router;
