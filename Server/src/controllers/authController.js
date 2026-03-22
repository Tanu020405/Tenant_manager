import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Tenant from "../models/tenantModel.js";
import { ValidationError, ConflictError } from "../middlewares/errorHandler.js";
import { sendMail } from "../utils/mailer.js";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Tenant from "../models/tenantModel.js";
import { ValidationError, ConflictError } from "../middlewares/errorHandler.js";

dotenv.config();

const defaultTenantThemes = {
  t1: {
    name: "Acme HQ",
    theme: {
      primary: "#1f2937",
      accent: "#2563eb",
      background: "#f5f5f4",
      surface: "#ffffff",
      text: "#0f172a",
      muted: "#4b5563",
    },
  },
  t2: {
    name: "Northwind Ops",
    theme: {
      primary: "#14532d",
      accent: "#0ea5e9",
      background: "#f8fafc",
      surface: "#ffffff",
      text: "#082f49",
      muted: "#64748b",
    },
  },
  t3: {
    name: "Globex Labs",
    theme: {
      primary: "#1e1b4b",
      accent: "#f59e0b",
      background: "#f9fafb",
      surface: "#ffffff",
      text: "#111827",
      muted: "#6b7280",
    },
  },
  default: {
    name: "Community Tenant",
    theme: {
      primary: "#1f2937",
      accent: "#2563eb",
      background: "#f8fafc",
      surface: "#ffffff",
      text: "#111827",
      muted: "#6b7280",
    },
  },
};

const generateToken = (user) =>
  jwt.sign({ id: user._id, tenantId: user.tenantId, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const ensureTenant = async (tenantId) => {
  const existing = await Tenant.findOne({ tenantId, isDeleted: false });
  if (existing) return existing;

  const fallback = defaultTenantThemes[tenantId] || defaultTenantThemes.default;
  return Tenant.create({
    tenantId,
    name: fallback.name,
    theme: fallback.theme,
  });
};

const sanitizeUser = (userDoc) => {
  const userObject = userDoc.toObject();
  delete userObject.password;
  return userObject;
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, tenantId, role } = req.body;

    if (!tenantId) {
      throw new ValidationError("tenantId is required");
    }

    if (!name || !email || !password) {
      throw new ValidationError("name, email, and password are required");
    }

    const tenant = await ensureTenant(tenantId);
    const existingUser = await User.findOne({ email, tenantId, isDeleted: false });
    if (existingUser) {
      throw new ConflictError("User already exists for this tenant");
    }

    // Allow explicit role assignment: superAdmin, tenant, or renter. Default to "tenant".
    const validRoles = ["superAdmin", "tenant", "renter"];
    const userRole = validRoles.includes(role) ? role : "tenant";
    const newUser = await User.create({ name, email, password, tenantId: tenant.tenantId, role: userRole });
    const token = generateToken(newUser);

    res.status(201).json({ success: true, data: { user: sanitizeUser(newUser), tenant, token } });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError("email and password are required");
    }

    const user = await User.findOne({ email, isDeleted: false });
    if (!user || user.password !== password) {
      throw new ValidationError("Invalid credentials");
    }

    const tenant = await ensureTenant(user.tenantId);
    const token = generateToken(user);
    res.status(200).json({ success: true, data: { user: sanitizeUser(user), tenant, token } });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new ValidationError("Email is required");

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(200).json({ success: true, message: "If that email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hr
    await user.save();

    const origin = req.headers.origin || "http://localhost:5173";
    const resetUrl = `${origin}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937;">Password Reset Request</h2>
        <p style="color: #4b5563;">You requested a password reset for your PropConnect account. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display:inline-block; margin-top: 15px; margin-bottom: 20px; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
        <p style="color: #6b7280; font-size: 13px;">If you did not request this, please ignore this email. This link will expire in 1 hour.</p>
      </div>
    `;

    // Fire & forget
    sendMail({ to: user.email, subject: "Password Reset Request", html })
      .catch(err => console.error("[Auth] Forgot password email failed:", err));

    res.status(200).json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) throw new ValidationError("New password is required");

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
      isDeleted: false
    });

    if (!user) throw new ValidationError("Password reset token is invalid or has expired.");

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password has been successfully updated." });
  } catch (err) {
    next(err);
  }
};

