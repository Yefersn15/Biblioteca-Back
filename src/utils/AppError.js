class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.isAppError = true;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
