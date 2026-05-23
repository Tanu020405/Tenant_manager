
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import userRoutes from "./src/routes/userRoutes.js";
import resourceRoutes from "./src/routes/resourceroutes.js";
import propertyRoutes from "./src/routes/propertyRoutes.js";
import renterRoutes from "./src/routes/renterRoutes.js";
import invoiceRoutes from "./src/routes/invoiceRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import analyticsRoutes from "./src/routes/analyticsRoutes.js";
import { handleWebhook } from "./src/controllers/paymentController.js";
import { connectDB } from "./src/config/db.js";
import { requestLogger } from "./src/middlewares/requestLogger.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import cron from "node-cron";
import { markOverdueInvoices, generateMonthlyInvoices } from "./src/utils/invoiceScheduler.js";

const app = express();

const defaultAllowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
]
  .map((item) => item?.trim())
  .filter(Boolean);

const allowedOrigins = (process.env.CORS_ORIGINS || defaultAllowedOrigins.join(","))
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const corsOriginHandler = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }
  const isLocalDevOrigin =
    process.env.NODE_ENV !== "production" &&
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  if (isLocalDevOrigin) {
    return callback(null, true);
  }
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  return callback(new Error("CORS origin not allowed"));
};

app.use(
  cors({
    origin: corsOriginHandler,
    credentials: true,
  })
);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/api/payments/webhook",
  })
);
// Webhook MUST be registered before express.json() — Razorpay signature
// verification requires the raw body Buffer, not parsed JSON.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

app.use(express.json());
app.use(requestLogger);

// Connect to MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("Server is running fine!");
});

// Connect user and resource routes

app.use("/api/user", userRoutes);
app.use("/api/tenants/:tenantId/posts", resourceRoutes);
app.use("/api/posts", resourceRoutes);
app.use("/api/tenants/:tenantId/properties", propertyRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/tenants/:tenantId/renters", renterRoutes);
app.use("/api/renters", renterRoutes);

app.use("/api/tenants/:tenantId/invoices", invoiceRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use("/api/tenants/:tenantId/payments", paymentRoutes);
app.use("/api/payments", paymentRoutes);

app.use("/api/tenants/:tenantId/analytics", analyticsRoutes);
app.use("/api/analytics", analyticsRoutes);

// Centralized error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on port ${PORT}`);

  if (process.env.ENABLE_CRON === "false") {
    console.log("[Cron] Disabled via ENABLE_CRON=false");
    return;
  }

  // Daily at midnight — mark pending invoices as overdue
  cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Running overdue invoice check...");
    try {
      await markOverdueInvoices();
    } catch (err) {
      console.error("[Cron] Overdue job failed:", err.message);
    }
  });

  // 1st of every month at 00:05 — auto-generate invoices for occupied properties
  cron.schedule("5 0 1 * *", async () => {
    console.log("[Cron] Running monthly invoice generation...");
    try {
      await generateMonthlyInvoices();
    } catch (err) {
      console.error("[Cron] Monthly generation failed:", err.message);
    }
  });
});
