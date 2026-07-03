export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};