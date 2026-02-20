const Logger = require("../../../../config/logger");

const errorMiddleware = (error, req, res, next) => {
  Logger.error(`${error.message} - ${req.method} ${req.url}`);

  const status = error.statusCode || error.status || 500;
  // Prefer bilingual { en, ar } message if available, fall back to plain string
  const message = error.i18nMessage || error.message || "Internal Server Error";
  console.error(error);
  // Log the error stack trace for debugging
  console.error(error.stack);

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    },
  });
};

module.exports = errorMiddleware;
