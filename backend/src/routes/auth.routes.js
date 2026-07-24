import express from "express";
import passport, { isGoogleOAuthConfigured } from "../config/passport.js";
import { env } from "../config/env.js";
import * as controller from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimit.js";
import { validateRequest } from "../middleware/validate.js";
import {
  loginValidator,
  registerValidator,
} from "../validators/auth.validator.js";

const router = express.Router();

const requireGoogleOAuth = (req, res, next) => {
  if (!isGoogleOAuthConfigured) {
    return res.status(503).json({
      success: false,
      message:
        "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env, then restart the backend server.",
    });
  }

  next();
};

router.post(
  "/register",
  authRateLimiter,
  registerValidator,
  validateRequest,
  controller.register
);

router.post(
  "/login",
  authRateLimiter,
  loginValidator,
  validateRequest,
  controller.login
);

router.post("/logout", verifyToken, controller.logout);
router.get("/me", verifyToken, controller.me);
router.put("/me", verifyToken, controller.updateMe);

router.get(
  "/google",
  requireGoogleOAuth,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  requireGoogleOAuth,
  passport.authenticate("google", {
    failureRedirect: `${env.CLIENT_URL}/login`,
    session: false,
  }),
  controller.googleCallback
);

export default router;
