import * as service from "../services/review.service.js";

export const create = async (req, res, next) => {
  try {
    const review = await service.createReview(req.user.id, req.body);

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
};
