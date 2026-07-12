import express from "express";
import * as controller from "../controllers/booking.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { bookingValidator } from "../validators/booking.validator.js";

const router = express.Router();

router.post(
  "/",
  verifyToken,
  requireRole("USER", "OWNER", "ADMIN"),
  bookingValidator,
  validateRequest,
  controller.create
);

export default router;
