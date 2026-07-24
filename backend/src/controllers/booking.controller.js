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

export const getOwn = async (req, res, next) => {
  try {
    const bookings = await service.getBookingsForUser(req.user.id);

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const booking = await service.getBookingByIdForUser(
      req.user.id,
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getOwnerRequests = async (req, res, next) => {
  try {
    const bookings = await service.getBookingRequestsForOwner(req.user);

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const booking = await service.cancelBooking(req.user.id, req.params.id);

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

export const accept = async (req, res, next) => {
  try {
    const booking = await service.updateBookingRequestStatus(
      req.user,
      req.params.id,
      "CONFIRMED"
    );

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

export const reject = async (req, res, next) => {
  try {
    const booking = await service.updateBookingRequestStatus(
      req.user,
      req.params.id,
      "REJECTED"
    );

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};
