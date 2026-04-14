module.exports = function errorHandler(err, req, res, next) {
  console.error(err);

  // Default to 500 if not specific
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = "Malformed JSON payload";
  }

  res.status(status).json({
    success: false,
    data: null,
    error: message
  });
};
