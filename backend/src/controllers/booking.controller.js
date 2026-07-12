import * as service from "../services/booking.service.js";

export const create = async (req, res, next) => {
  try {
    const booking = await service.createBooking(req.user.id, req.body);

    res.status(201).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};
