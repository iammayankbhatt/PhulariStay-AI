import express from "express";
import * as controller from "../controllers/booking.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { bookingValidator } from "../validators/booking.validator.js";

const router = express.Router();

router.get("/", verifyToken, controller.getOwn);
router.get(
  "/owner/requests",
  verifyToken,
  requireRole("OWNER", "ADMIN"),
  controller.getOwnerRequests
);
router.get("/:id", verifyToken, controller.getOne);

router.post(
  "/",
  verifyToken,
  requireRole("USER", "OWNER", "ADMIN"),
  bookingValidator,
  validateRequest,
  controller.create
);

router.patch("/:id/cancel", verifyToken, controller.cancel);
router.patch(
  "/:id/accept",
  verifyToken,
  requireRole("OWNER", "ADMIN"),
  controller.accept
);
router.patch(
  "/:id/reject",
  verifyToken,
  requireRole("OWNER", "ADMIN"),
  controller.reject
);

export default router;
