import prisma from "../config/prisma.js";
import { verifyJwt } from "../utils/jwt.js";

const getBearerToken = (authHeader) => {
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);

  if (!match?.[1]) {
    return null;
  }

  return match[1].trim().replace(/^["']|["']$/g, "");
};

export const verifyToken = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const payload = verifyJwt(token);

    if (!payload?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profileImage: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("JWT verification failed:", error.message);
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
