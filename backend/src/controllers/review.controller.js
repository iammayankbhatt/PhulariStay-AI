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

export const update = async (req, res, next) => {
  try {
    const review = await service.updateReview(req.user, req.params.id, req.body);

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await service.deleteReview(req.user, req.params.id);

    res.status(200).json({
      success: true,
      message: "Review deleted",
    });
  } catch (error) {
    next(error);
  }
};

export const helpful = async (req, res, next) => {
  try {
    const review = await service.markHelpful(req.params.id);

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
};

export const reply = async (req, res, next) => {
  try {
    const review = await service.replyToReview(
      req.user,
      req.params.id,
      req.body.ownerReply
    );

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
};

export const createCivic = async (req, res, next) => {
  try {
    const review = await service.createCivicReview(req.user.id, req.body);

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
};

export const civicIndex = async (req, res, next) => {
  try {
    const reviews = await service.getCivicReviews(req.params.userId);

    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCivic = async (req, res, next) => {
  try {
    await service.deleteCivicReview(req.user, req.params.id);

    res.status(200).json({
      success: true,
      message: "Civic review deleted",
    });
  } catch (error) {
    next(error);
  }
};
