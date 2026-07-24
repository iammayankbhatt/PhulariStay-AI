import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import { signToken } from "../utils/jwt.js";
import { toSafeUser } from "../utils/userDto.js";

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
  const params = new URLSearchParams({
    token,
    id: req.user.id,
    name: req.user.fullName,
    email: req.user.email,
    role: req.user.role,
  });

  if (req.user.profileImage) {
    params.set("avatar", req.user.profileImage);
  }

  res.redirect(`${env.CLIENT_URL}/login?${params.toString()}`);
};

export const googleJsonCallback = (req, res) => {
  res.status(200).json({
    success: true,
    token: signToken(req.user),
    user: toSafeUser(req.user),
  });
};
