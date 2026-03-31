const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("./errorHandler");

const JWT_SECRET = "super-secret-blog-key-dont-tell-anyone-2024";

/**
 * 认证中间件 - 验证 JWT token
 * @param {express.Request} req - 请求对象
 * @param {express.Response} res - 响应对象
 * @param {express.NextFunction} next - 下一个中间件
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("No token provided");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = { userId: decoded.userId, username: decoded.username };
  next();
}

module.exports = {
  authenticate,
  JWT_SECRET,
};
