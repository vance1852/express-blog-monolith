class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class BadRequestError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message || "Unauthorized", 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message || "Forbidden", 403);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message || "Not found", 404);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
  }
}

/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {express.Request} req - 请求对象
 * @param {express.Response} res - 响应对象
 * @param {express.NextFunction} next - 下一个中间件
 */
function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  res.status(500).json({ error: "Internal server error" });
}

/**
 * 包装异步路由处理器，自动捕获错误
 * @param {Function} fn - 异步路由处理器
 * @returns {Function} 包装后的处理器
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  errorHandler,
  asyncHandler,
};
