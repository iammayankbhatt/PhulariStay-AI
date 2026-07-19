import express from "express";

import * as controller from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/travel-plan", controller.createTravelPlan);

export default router;
