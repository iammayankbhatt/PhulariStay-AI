import { body } from "express-validator";

export const reviewValidator = [
  body("homestayId").trim().notEmpty().withMessage("Homestay is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage("Comment must be between 5 and 1000 characters"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("visitDate")
    .isISO8601()
    .withMessage("Visit date must be a valid date"),
];

export const ownerReplyValidator = [
  body("ownerReply")
    .trim()
    .isLength({ min: 2, max: 1000 })
    .withMessage("Owner reply must be between 2 and 1000 characters"),
];

export const civicReviewValidator = [
  body("targetUserId").trim().notEmpty().withMessage("User is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage("Comment must be between 5 and 1000 characters"),
  body("images").optional().isArray().withMessage("Images must be an array"),
];
