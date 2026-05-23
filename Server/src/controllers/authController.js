import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Tenant from "../models/tenantModel.js";
import { ValidationError, ConflictError } from "../middlewares/errorHandler.js";
import { sendMail } from "../utils/mailer.js";

dotenv.config();

const defaultTenantTheme = {
  primary: "#1f2937",
  accent: "#2563eb",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#111827",
  muted: "#6b7280",
};

const generateToken = (user) =>
  jwt.sign({ id: user._id, tenantId: user.tenantId, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

const generateTenantCandidates = (name, email) => {
  const emailLocal = String(email || "").split("@")[0];
  const base = slugify(name) || slugify(emailLocal) || "tenant";
  return [
    base,
    `${base}-hub`,
    `${base}-${Math.random().toString(36).slice(2, 6)}`,
    `${base}-${Date.now().toString(36).slice(-5)}`,
  ];
};

const createTenantForUser = async ({ name, email }) => {
  const tenantName = String(name || "").trim() || "My Organization";
  const candidates = generateTenantCandidates(name, email);

  for (const candidate of candidates) {
    const existing = await Tenant.findOne({ tenantId: candidate, isDeleted: false });
    if (existing) continue;
    return Tenant.create({
      tenantId: candidate,
      name: tenantName,
      theme: defaultTenantTheme,
    });
  }

  throw new ConflictError("Unable to provision organization. Please try again.");
};

const sanitizeUser = (userDoc) => {
  const userObject = userDoc.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const getClientBaseUrl = () => process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";

const isBcryptHash = (value) => /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(String(value || ""));

const isLegacyPlaintextPasswordMatch = (storedPassword, candidatePassword) => {
  const stored = String(storedPassword || "");
  const candidate = String(candidatePassword || "");

  if (!stored || !candidate || stored.length !== candidate.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(candidate));
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !email || !password) {
      throw new ValidationError("name, email, and password are required");
    }

    if (String(password).length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    if (req.body.role && req.body.role !== "tenant") {
      throw new ValidationError("Public registration only supports tenant accounts");
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
      isDeleted: false,
    });
    if (existingUser) {
      throw new ConflictError("User already exists for this email");
    }

    const tenant = await createTenantForUser({ name, email: normalizedEmail });

    const newUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      tenantId: tenant.tenantId,
      role: "tenant",
    });
    const token = generateToken(newUser);

    res.status(201).json({ success: true, data: { user: sanitizeUser(newUser), tenant, token } });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      throw new ValidationError("email and password are required");
    }

    const user = await User.findOne({
      email: normalizedEmail,
      isDeleted: false,
    });

    let passwordMatched = false;

    if (user) {
      if (isBcryptHash(user.password)) {
        passwordMatched = await user.comparePassword(password);
      } else {
        passwordMatched = isLegacyPlaintextPasswordMatch(user.password, password);
        if (passwordMatched) {
          // One-time migration path for legacy plaintext records.
          user.password = password;
          user.markModified("password");
          await user.save();
        }
      }
    }

    if (!user || !passwordMatched) {
      throw new ValidationError("Invalid credentials");
    }

    const tenant = await Tenant.findOne({ tenantId: user.tenantId, isDeleted: false });
    const token = generateToken(user);
    res.status(200).json({ success: true, data: { user: sanitizeUser(user), tenant, token } });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      throw new ValidationError("Email is required");
    }

    const user = await User.findOne({
      email: normalizedEmail,
      isDeleted: false,
    });

    if (!user) {
      return res.status(200).json({ success: true, message: "If that email exists, a reset link has been sent." });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${getClientBaseUrl()}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937;">Password Reset Request</h2>
        <p style="color: #4b5563;">You requested a password reset for your PropConnect account. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display:inline-block; margin-top: 15px; margin-bottom: 20px; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
        <p style="color: #6b7280; font-size: 13px;">If you did not request this, please ignore this email. This link will expire in 1 hour.</p>
      </div>
    `;

    sendMail({ to: user.email, subject: "Password Reset Request", html })
      .catch(err => console.error(`[Auth] ❌ Forgot password email failed for ${user.email}:`, err.message));

    res.status(200).json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      throw new ValidationError("New password is required");
    }
    if (String(password).length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
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

