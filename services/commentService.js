const postRepository = require('../repositories/postRepository');
const commentRepository = require('../repositories/commentRepository');
const { DEFAULT_COMMENTS_PAGE_SIZE, MAX_COMMENT_LENGTH } = require('../config');
const { AppError } = require('../middleware/errorHandler');

/**
 * 评论服务层
 */
class CommentService {
  /**
   * 获取文章的评论列表（分页）
   * @param {number} postId - 文章 ID
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Object} 评论列表和分页信息
   */
  async getCommentsByPostId(postId, page = 1, limit = DEFAULT_COMMENTS_PAGE_SIZE) {
    const postExists = postRepository.exists(postId);
    if (!postExists) {
      throw new AppError('Post not found', 404);
    }

    const offset = (page - 1) * limit;
    const comments = commentRepository.findByPostId(postId, limit, offset);
    const total = commentRepository.countByPostId(postId);
    const totalPages = Math.ceil(total / limit);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * 添加评论
   * @param {number} userId - 用户 ID
   * @param {number} postId - 文章 ID
   * @param {string} content - 评论内容
   * @returns {Object} 新创建的评论
   */
  async createComment(userId, postId, content) {
    if (!content) {
      throw new AppError('Comment content is required', 400);
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      throw new AppError(
        `Comment is too long (max ${MAX_COMMENT_LENGTH} characters)`,
        400
      );
    }

    const postExists = postRepository.exists(postId);
    if (!postExists) {
      throw new AppError('Post not found', 404);
    }

    const commentId = commentRepository.create(content, postId, userId);

    return commentRepository.findByIdWithAuthor(commentId);
  }

  /**
   * 删除评论
   * @param {number} userId - 用户 ID
   * @param {number} commentId - 评论 ID
   * @returns {Object} 删除结果消息
   */
  async deleteComment(userId, commentId) {
    const comment = commentRepository.findById(commentId);
    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.author_id !== userId) {
      throw new AppError('You can only delete your own comments', 403);
    }

    commentRepository.delete(commentId);

    return {
      message: 'Comment deleted'
    };
  }
}

module.exports = new CommentService();
