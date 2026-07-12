import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const getJwtSecret = () => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }

  return env.JWT_SECRET;
};

export const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );

export const verifyJwt = (token) => jwt.verify(token, getJwtSecret());
