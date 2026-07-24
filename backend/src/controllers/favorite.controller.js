import * as service from "../services/favorite.service.js";

export const index = async (req, res, next) => {
  try {
    const favorites = await service.getWishlist(req.user.id);

    res.status(200).json({
      success: true,
      favorites,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const favorite = await service.addToWishlist(
      req.user.id,
      req.body.homestayId
    );

    res.status(201).json({
      success: true,
      favorite,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await service.removeFromWishlist(req.user.id, req.params.homestayId);

    res.status(200).json({
      success: true,
      message: "Removed from wishlist",
    });
  } catch (error) {
    next(error);
  }
};
