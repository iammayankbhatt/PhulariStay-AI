import express from "express";

import * as controller from "../controllers/homestay.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import {
  createHomestayValidator,
  updateHomestayValidator,
} from "../validators/homestay.validator.js";

const router = express.Router();

router.get("/", controller.getAll);

router.get("/search", controller.search);

router.get("/:id", controller.getOne);

router.post(
  "/",
  verifyToken,
  requireRole("OWNER", "ADMIN"),
  createHomestayValidator,
  validateRequest,
  controller.create
);

router.put(
  "/:id",
  verifyToken,
  requireRole("OWNER", "ADMIN"),
  updateHomestayValidator,
  validateRequest,
  controller.update
);

router.patch(
  "/:id/rooms/:roomId/availability",
  verifyToken,
  requireRole("OWNER", "ADMIN"),
  controller.updateRoomAvailability
);

router.patch(
  "/:id/rooms/:roomId/calendar",
  verifyToken,
  requireRole("OWNER", "ADMIN"),
  controller.updateRoomDateAvailability
);

router.delete(
  "/:id",
  verifyToken,
  requireRole("OWNER", "ADMIN"),
  controller.remove
);

export default router;
