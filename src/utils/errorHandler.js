// src/utils/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error(err); 
  res.status(5.0).json({
    message: "An unexpected error occurred on the server.",
  });
}

module.exports = errorHandler;