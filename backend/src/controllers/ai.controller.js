import * as service from "../services/ai.service.js";

const travelStyles = ["Solo", "Family", "Friends", "Couple", "Adventure"];

const validateTravelPlanInput = ({
  from,
  destination,
  days,
  budget,
  travelStyle,
  interests,
}) => {
  if (!from || !destination || !days || !budget || !travelStyle || !interests) {
    return "From, destination, days, budget, travel style, and interests are required.";
  }

  const numericDays = Number(days);
  const numericBudget = Number(budget);

  if (!Number.isInteger(numericDays) || numericDays < 1 || numericDays > 30) {
    return "Days must be a whole number between 1 and 30.";
  }

  if (!Number.isFinite(numericBudget) || numericBudget < 1000) {
    return "Budget must be at least 1000.";
  }

  if (!travelStyles.includes(travelStyle)) {
    return "Travel style is invalid.";
  }

  return null;
};

export const createTravelPlan = async (req, res) => {
  const validationError = validateTravelPlanInput(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  try {
    const plan = await service.generateTravelPlan({
      from: req.body.from.trim(),
      destination: req.body.destination.trim(),
      days: Number(req.body.days),
      budget: Number(req.body.budget),
      travelStyle: req.body.travelStyle,
      interests: req.body.interests.trim(),
    });

    return res.status(200).json({
      success: true,
      plan,
    });
  } catch (error) {
    const statusCode = error.status || error.statusCode || 500;
    const isRateLimit = statusCode === 429;

    return res.status(isRateLimit ? 429 : statusCode >= 400 ? statusCode : 500).json({
      success: false,
      message: isRateLimit
        ? "Gemini rate limit reached. Please try again shortly."
        : error.message || "Unable to generate travel plan right now.",
    });
  }
};
