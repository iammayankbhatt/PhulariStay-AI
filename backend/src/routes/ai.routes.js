import express from "express";

import * as controller from "../controllers/ai.controller.js";
import { verifyToken } from "../middleware/auth.js";
import { aiRateLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post(
  "/travel-plan",
  verifyToken,
  aiRateLimiter,
  controller.createTravelPlan
);

export default router;
