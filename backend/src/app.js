import express from "express";
import cors from "cors";
import morgan from "morgan";

import { env } from "./config/env.js";
import homestayRoutes from "./routes/homestay.routes.js";

import { notFound } from "./middleware/notFound.js";

import { errorHandler } from "./middleware/errorHandler.js";
const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(morgan("dev"));


app.use("/api/homestays", homestayRoutes);

app.use(notFound);

app.use(errorHandler);


app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PhulariStay AI Backend Running",
  });
});

export default app;