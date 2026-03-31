const commentsRepository = require("../repositories/comments.repository");

/**
 * 获取文章的评论列表
 * @param {number} postId - 文章ID
 * @param {Object} query - 查询参数
 * @param {number} [query.page=1] - 页码
 * @param {number} [query.limit=20] - 每页数量
 * @returns {{ comments: Array, pagination: { page: number, limit: number, total: number, totalPages: number } }} 评论列表和分页信息
 * @throws {Error} 文章不存在时抛出错误
 */
function getCommentsByPostId(postId, query) {
  if (!commentsRepository.postExists(postId)) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;

  const result = commentsRepository.findByPostId(postId, page, limit);

  return {
    data: result.comments,
    total: result.total,
    page,
    limit,
  };
}

/**
 * 添加评论
 * @param {number} userId - 用户ID
 * @param {number} postId - 文章ID
 * @param {string} content - 评论内容
 * @returns {Object} 创建的评论
 * @throws {Error} 验证失败时抛出错误
 */
function addComment(userId, postId, content) {
  if (!content) {
    const error = new Error("Comment content is required");
    error.statusCode = 400;
    throw error;
  }

  if (content.length > 1000) {
    const error = new Error("Comment is too long (max 1000 characters)");
    error.statusCode = 400;
    throw error;
  }

  if (!commentsRepository.postExists(postId)) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  const comment = commentsRepository.create(content, postId, userId);
  return { comment };
}

/**
 * 删除评论
 * @param {number} userId - 用户ID
 * @param {number} commentId - 评论ID
 * @returns {{ message: string }} 删除结果
 * @throws {Error} 验证失败时抛出错误
 */
function deleteComment(userId, commentId) {
  const comment = commentsRepository.findById(commentId);
  if (!comment) {
    const error = new Error("Comment not found");
    error.statusCode = 404;
    throw error;
  }

  if (comment.author_id !== userId) {
    const error = new Error("You can only delete your own comments");
    error.statusCode = 403;
    throw error;
  }

  commentsRepository.remove(commentId);
  return { message: "Comment deleted" };
}

module.exports = {
  getCommentsByPostId,
  addComment,
  deleteComment,
};
