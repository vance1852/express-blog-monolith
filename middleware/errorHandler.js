/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {import('express').Request} req - Express 请求对象
 * @param {import('express').Response} res - Express 响应对象
 * @param {import('express').NextFunction} next - Express 下一个中间件函数
 */
function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack })
  });
}

/**
 * 404 中间件
 * @param {import('express').Request} req - Express 请求对象
 * @param {import('express').Response} res - Express 响应对象
 */
function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

class AppError extends Error {
  /**
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP 状态码
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError
};
