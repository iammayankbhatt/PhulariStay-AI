import * as service from "../services/homestay.service.js";

export const getAll = async (req, res, next) => {
  try {
    const homestays = await service.getAllHomestays();
    res.status(200).json(homestays);
  } catch (error) {
    next(error);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const homestay = await service.getHomestayById(req.params.id);

    if (!homestay) {
      return res.status(404).json({
        message: "Homestay not found",
      });
    }

    res.status(200).json(homestay);
  } catch (error) {
    next(error);
  }
};

export const search = async (req, res, next) => {
  try {
    const homestays = await service.searchHomestays(
      req.query.q || ""
    );

    res.status(200).json(homestays);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const homestay = await service.createHomestay({
      ...req.body,
      ownerId: req.user.id,
    });

    res.status(201).json(homestay);
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const existingHomestay = await service.getHomestayById(req.params.id);

    if (!existingHomestay) {
      return res.status(404).json({
        message: "Homestay not found",
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      existingHomestay.ownerId !== req.user.id
    ) {
      return res.status(403).json({
        message: "Only the owner can update this homestay",
      });
    }

    const homestay = await service.updateHomestay(
      req.params.id,
      req.body
    );

    res.status(200).json(homestay);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const existingHomestay = await service.getHomestayById(req.params.id);

    if (!existingHomestay) {
      return res.status(404).json({
        message: "Homestay not found",
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      existingHomestay.ownerId !== req.user.id
    ) {
      return res.status(403).json({
        message: "Only the owner can delete this homestay",
      });
    }

    await service.deleteHomestay(req.params.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
