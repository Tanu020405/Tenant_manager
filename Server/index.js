
import express from "express";
import cors from "cors";
import userRoutes from "./src/routes/userRoutes.js";
import resourceRoutes from "./src/routes/resourceroutes.js";
import { connectDB } from "./src/config/db.js";
import { requestLogger } from "./src/middlewares/requestLogger.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultOrigins = ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigins = allowedOrigins.length ? allowedOrigins : defaultOrigins;
      if (normalizedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
