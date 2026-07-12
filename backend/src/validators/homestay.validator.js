import { body } from "express-validator";

export const createHomestayValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description")
    .trim()
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("latitude").isFloat().withMessage("Latitude must be a number"),
  body("longitude").isFloat().withMessage("Longitude must be a number"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("pricePerNight")
    .isFloat({ min: 0 })
    .withMessage("Price per night must be a positive number"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("amenities")
    .optional()
    .isArray()
    .withMessage("Amenities must be an array"),
];

export const updateHomestayValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name is required"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),
  body("location")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Location is required"),
  body("latitude").optional().isFloat().withMessage("Latitude must be a number"),
  body("longitude")
    .optional()
    .isFloat()
    .withMessage("Longitude must be a number"),
  body("address").optional().trim().notEmpty().withMessage("Address is required"),
  body("pricePerNight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price per night must be a positive number"),
  body("images").optional().isArray().withMessage("Images must be an array"),
  body("amenities")
    .optional()
    .isArray()
    .withMessage("Amenities must be an array"),
];
