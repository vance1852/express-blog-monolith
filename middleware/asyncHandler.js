/**
 * 异步路由处理包装器，自动捕获错误并传递给错误处理中间件
 * @param {Function} fn - 异步路由处理函数
 * @returns {import('express').RequestHandler} Express 路由处理函数
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
