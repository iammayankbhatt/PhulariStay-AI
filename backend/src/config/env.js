import dotenv from "dotenv";

dotenv.config();

const trimTrailingSlash = (value) => value?.replace(/\/+$/, "");
const clientUrl =
  trimTrailingSlash(process.env.CLIENT_URL) ||
  trimTrailingSlash(process.env.FRONTEND_URL) ||
  "";
const publicApiUrl =
  trimTrailingSlash(process.env.PUBLIC_API_URL) ||
  trimTrailingSlash(process.env.RENDER_EXTERNAL_URL) ||
  "";

export const env = {
  PORT: process.env.PORT || 5000,
  CLIENT_URL: clientUrl,
  CLIENT_URLS: (process.env.CLIENT_URLS || clientUrl)
    .split(",")
    .map((url) => trimTrailingSlash(url.trim()))
    .filter(Boolean),
  PUBLIC_API_URL: publicApiUrl,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_CALLBACK_URL ||
    (publicApiUrl ? `${publicApiUrl}/api/auth/google/callback` : undefined),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};
