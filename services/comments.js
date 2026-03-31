const commentRepository = require("../repositories/comments");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../middleware/errorHandler");

/**
 * 评论服务层
 */
class CommentService {
  /**
   * 获取文章的评论列表
   * @param {number} postId - 文章ID
   * @param {Object} query - 查询参数
   * @param {string} [query.page] - 页码
   * @param {string} [query.limit] - 每页数量
   * @returns {Object} 包含评论列表和分页信息
   */
  getCommentsByPostId(postId, query) {
    const post = commentRepository.checkPostExists(postId);
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;

    return commentRepository.findByPostId(postId, { page, limit });
  }

  /**
   * 创建评论
   * @param {number} userId - 用户ID
   * @param {number} postId - 文章ID
   * @param {Object} commentData - 评论数据
   * @returns {Object} 创建的评论
   */
  createComment(userId, postId, commentData) {
    const { content } = commentData;

    if (!content) {
      throw new BadRequestError("Comment content is required");
    }

    if (content.length > 1000) {
      throw new BadRequestError("Comment is too long (max 1000 characters)");
    }

    const post = commentRepository.checkPostExists(postId);
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    const result = commentRepository.create({ content, postId, authorId: userId });
    return commentRepository.findByIdWithAuthor(result.lastInsertRowid);
  }

  /**
   * 删除评论
   * @param {number} userId - 用户ID
   * @param {number} commentId - 评论ID
   * @returns {Object} 删除消息
   */
  deleteComment(userId, commentId) {
    const comment = commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError("Comment not found");
    }

    if (comment.author_id !== userId) {
      throw new ForbiddenError("You can only delete your own comments");
    }

    commentRepository.delete(commentId);
    return { message: "Comment deleted" };
  }
}

module.exports = new CommentService();
