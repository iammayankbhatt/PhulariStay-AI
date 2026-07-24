export const errorHandler = (err, req, res, next) => {
  void next;
  console.error(err);

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
    });
  }

  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
    });
  }

  if (err.code === "P2011") {
    return res.status(400).json({
      success: false,
      message:
        "A required database field is missing. If this happened during registration, run the latest Prisma migration so User.phone is nullable.",
    });
  }

  if (err.code === "P1001") {
    return res.status(503).json({
      success: false,
      message:
        "Unable to connect to the database. Check DATABASE_URL, Supabase connection mode, and network access.",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
