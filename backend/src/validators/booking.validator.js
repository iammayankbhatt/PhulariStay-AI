import { body } from "express-validator";

export const bookingValidator = [
  body("homestayId").trim().notEmpty().withMessage("Homestay is required"),
  body("checkIn").isISO8601().withMessage("Valid check-in date is required"),
  body("checkOut").isISO8601().withMessage("Valid check-out date is required"),
  body("guests")
    .isInt({ min: 1 })
    .withMessage("Guests must be at least 1"),
];
