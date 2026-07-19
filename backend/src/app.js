import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";

import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import homestayRoutes from "./routes/homestay.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import aiRoutes from "./routes/ai.routes.js";

import { notFound } from "./middleware/notFound.js";

import { errorHandler } from "./middleware/errorHandler.js";
const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/homestays", homestayRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PhulariStay AI Backend Running",
  });
});

app.use(notFound);

app.use(errorHandler);

export default app;
