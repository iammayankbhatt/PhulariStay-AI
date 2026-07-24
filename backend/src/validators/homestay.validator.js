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
  body("rooms")
    .isArray({ min: 1 })
    .withMessage("At least one room type is required"),
  body("rooms.*.roomType")
    .isIn(["STANDARD", "DELUXE", "FAMILY", "DORMITORY"])
    .withMessage("Room type is invalid"),
  body("rooms.*.totalRooms")
    .isInt({ min: 1 })
    .withMessage("Total rooms must be at least 1"),
  body("rooms.*.availableRooms")
    .isInt({ min: 0 })
    .withMessage("Available rooms must be 0 or more"),
  body("rooms.*.capacity")
    .isInt({ min: 1 })
    .withMessage("Capacity must be at least 1"),
  body("rooms.*.price")
    .isFloat({ min: 0 })
    .withMessage("Room price must be a positive number"),
  body("rooms.*.images")
    .optional()
    .isArray()
    .withMessage("Room images must be an array"),
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
  body("rooms").optional().isArray({ min: 1 }).withMessage("At least one room type is required"),
  body("rooms.*.roomType")
    .optional()
    .isIn(["STANDARD", "DELUXE", "FAMILY", "DORMITORY"])
    .withMessage("Room type is invalid"),
  body("rooms.*.totalRooms")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Total rooms must be at least 1"),
  body("rooms.*.availableRooms")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Available rooms must be 0 or more"),
  body("rooms.*.capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Capacity must be at least 1"),
  body("rooms.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Room price must be a positive number"),
  body("rooms.*.images")
    .optional()
    .isArray()
    .withMessage("Room images must be an array"),
];
