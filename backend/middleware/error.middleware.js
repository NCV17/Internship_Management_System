/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);
  console.error(err.stack);

  // SQL Server errors
  if (err.code === "ECONNREFUSED") {
    return res.status(503).json({
      success: false,
      message: "Database connection failed. Please try again later.",
    });
  }

  if (err.code === "ETIMEOUT") {
    return res.status(503).json({
      success: false,
      message: "Database request timed out.",
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Default
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error.",
  });
};

module.exports = errorHandler;
