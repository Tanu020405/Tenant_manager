import jwt from "jsonwebtoken";
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

    // Only allow 'admin' role if explicitly provided, default to 'tenant'
    const userRole = role === "admin" ? "admin" : "tenant";
    const newUser = await User.create({ name, email, password, tenantId: tenant.tenantId, role: userRole });
    const token = generateToken(newUser);

    res.status(201).json({ success: true, data: { user: sanitizeUser(newUser), tenant, token } });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
      throw new ValidationError("email, password, and tenantId are required");
    }

    const user = await User.findOne({ email, tenantId, isDeleted: false });
    if (!user || user.password !== password) {
      throw new ValidationError("Invalid credentials");
    }

    const tenant = await ensureTenant(tenantId);
    const token = generateToken(user);
    res.status(200).json({ success: true, data: { user: sanitizeUser(user), tenant, token } });
  } catch (err) {
    next(err);
  }
};
