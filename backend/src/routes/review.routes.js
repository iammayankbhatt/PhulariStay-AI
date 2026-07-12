import express from "express";
import * as controller from "../controllers/review.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { reviewValidator } from "../validators/review.validator.js";

const router = express.Router();

router.post(
  "/",
  verifyToken,
  requireRole("USER", "OWNER", "ADMIN"),
  reviewValidator,
  validateRequest,
  controller.create
);

export default router;
