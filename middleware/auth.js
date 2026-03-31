const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { AppError } = require('./errorHandler');

/**
 * JWT 认证中间件
 * @param {import('express').Request} req - Express 请求对象
 * @param {import('express').Response} res - Express 响应对象
 * @param {import('express').NextFunction} next - Express 下一个中间件函数
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticate
};
