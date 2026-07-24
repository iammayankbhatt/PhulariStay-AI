import express from "express";
import * as controller from "../controllers/review.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { reviewValidator } from "../validators/review.validator.js";
import { ownerReplyValidator } from "../validators/review.validator.js";
import { civicReviewValidator } from "../validators/review.validator.js";

const router = express.Router();

router.post(
  "/",
  verifyToken,
  requireRole("USER", "OWNER", "ADMIN"),
  reviewValidator,
  validateRequest,
  controller.create
);

router.get("/civic/:userId", verifyToken, controller.civicIndex);

router.post(
  "/civic",
  verifyToken,
  requireRole("USER", "OWNER", "ADMIN"),
  civicReviewValidator,
  validateRequest,
  controller.createCivic
);

router.delete("/civic/:id", verifyToken, controller.removeCivic);

router.patch("/:id/helpful", verifyToken, controller.helpful);

router.put(
  "/:id",
  verifyToken,
  reviewValidator,
  validateRequest,
  controller.update
);

router.delete("/:id", verifyToken, controller.remove);

router.patch(
  "/:id/reply",
  verifyToken,
  requireRole("OWNER", "ADMIN"),
  ownerReplyValidator,
  validateRequest,
  controller.reply
);

export default router;
