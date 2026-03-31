/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {import('express').Request} req - 请求对象
 * @param {import('express').Response} res - 响应对象
 * @param {import('express').NextFunction} next - 下一个中间件
 */
function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  res.status(500).json({ error: "Internal server error" });
}

module.exports = errorHandler;
