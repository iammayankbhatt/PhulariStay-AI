import express from "express";
import { body } from "express-validator";
import * as controller from "../controllers/favorite.controller.js";
import { verifyToken } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";

const router = express.Router();

router.get("/", verifyToken, controller.index);

router.post(
  "/",
  verifyToken,
  body("homestayId").trim().notEmpty().withMessage("Homestay is required"),
  validateRequest,
  controller.create
);

router.delete("/:homestayId", verifyToken, controller.remove);

export default router;
