import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import { signToken, verifyJwt } from "../utils/jwt.js";
import { toSafeUser } from "../utils/userDto.js";

const GOOGLE_OAUTH_COOKIE = "phularistay_google_oauth";

const googleCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth/google/session",
  maxAge: 2 * 60 * 1000,
};

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  req.logout?.(() => undefined);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const me = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const user = await authService.updateCurrentUser(req.user.id, req.body);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const googleCallback = (req, res) => {
  const token = signToken(req.user);

  res.cookie(GOOGLE_OAUTH_COOKIE, token, googleCookieOptions);
  res.redirect(`${env.CLIENT_URL}/dashboard`);
};

export const googleSession = async (req, res, next) => {
  try {
    const token = req.cookies?.[GOOGLE_OAUTH_COOKIE];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No Google OAuth session found",
      });
    }

    const payload = verifyJwt(token);
    const user = await authService.getCurrentUser(payload.id || payload.sub);

    res.clearCookie(GOOGLE_OAUTH_COOKIE, {
      ...googleCookieOptions,
      maxAge: undefined,
    });

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    res.clearCookie(GOOGLE_OAUTH_COOKIE, {
      ...googleCookieOptions,
      maxAge: undefined,
    });
    next(error);
  }
};

export const googleJsonCallback = (req, res) => {
  res.status(200).json({
    success: true,
    token: signToken(req.user),
    user: toSafeUser(req.user),
  });
};
