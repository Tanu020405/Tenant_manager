import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { tenantResolver } from "../middlewares/tenantResolver.js";
import { requireRole } from "../middlewares/requireRole.js";
import {
    createOrder,
    verifyPayment,
    getPaymentHistory,
    handleWebhook,
} from "../controllers/paymentController.js";

const router = express.Router({ mergeParams: true });

// Webhook — no auth, raw body required for HMAC signature verification
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

router.use(verifyToken);
router.use(tenantResolver);

// renter: initiate and complete payment
router.post("/create-order", requireRole("renter"), createOrder);
router.post("/verify", requireRole("renter"), verifyPayment);

// tenant or renter: view payment history (controller scopes by role)
router.get("/history", requireRole("tenant", "renter"), getPaymentHistory);

export default router;
