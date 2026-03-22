
import express from "express";
import cors from "cors";
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

app.use(
  cors({
    origin: true, // `true` dynamically sets the 'Access-Control-Allow-Origin' header to the requesting origin, allowing all while supporting credentials
    credentials: true,
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
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);

  // Daily at midnight — mark pending invoices as overdue
  cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Running overdue invoice check...");
    await markOverdueInvoices();
  });

  // 1st of every month at 00:05 — auto-generate invoices for occupied properties
  cron.schedule("5 0 1 * *", async () => {
    console.log("[Cron] Running monthly invoice generation...");
    await generateMonthlyInvoices();
  });
});
