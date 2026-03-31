const postRepository = require('../repositories/postRepository');
const commentRepository = require('../repositories/commentRepository');
const { DEFAULT_PAGE_SIZE } = require('../config');
const { AppError } = require('../middleware/errorHandler');

/**
 * 文章服务层
 */
class PostService {
  /**
   * 获取文章列表（分页）
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @param {number} authorId - 作者 ID（可选）
   * @returns {Object} 文章列表和分页信息
   */
  async getPosts(page = 1, limit = DEFAULT_PAGE_SIZE, authorId) {
    const offset = (page - 1) * limit;

    let posts;
    let total;

    if (authorId) {
      posts = postRepository.findByAuthorId(authorId, limit, offset);
      total = postRepository.countByAuthorId(authorId);
    } else {
      posts = postRepository.findAll(limit, offset);
      total = postRepository.countAll();
    }

    const totalPages = Math.ceil(total / limit);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * 获取单篇文章详情（含评论）
   * @param {number} postId - 文章 ID
   * @returns {Object} 文章详情和评论列表
   */
  async getPostById(postId) {
    const post = postRepository.findById(postId);
    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const comments = commentRepository.findByPostId(postId, 1000, 0);

    return {
      ...post,
      comments
    };
  }

  /**
   * 创建新文章
   * @param {number} userId - 用户 ID
   * @param {string} title - 标题
   * @param {string} content - 内容
   * @param {string} status - 状态
   * @returns {Object} 新创建的文章
   */
  async createPost(userId, title, content, status) {
    if (!title || !content) {
      throw new AppError('Title and content are required', 400);
    }

    const postStatus = status || 'published';
    const postId = postRepository.create(title, content, userId, postStatus);

    return postRepository.findById(postId);
  }

  /**
   * 更新文章
   * @param {number} userId - 用户 ID
   * @param {number} postId - 文章 ID
   * @param {string} title - 新标题
   * @param {string} content - 新内容
   * @param {string} status - 新状态
   * @returns {Object} 更新后的文章
   */
  async updatePost(userId, postId, title, content, status) {
    const existing = postRepository.findByIdRaw(postId);
    if (!existing) {
      throw new AppError('Post not found', 404);
    }

    if (existing.author_id !== userId) {
      throw new AppError('You can only edit your own posts', 403);
    }

    const updatedTitle = title || existing.title;
    const updatedContent = content || existing.content;
    const updatedStatus = status || existing.status;

    postRepository.update(postId, updatedTitle, updatedContent, updatedStatus);

    return postRepository.findById(postId);
  }

  /**
   * 删除文章
   * @param {number} userId - 用户 ID
   * @param {number} postId - 文章 ID
   * @returns {Object} 删除结果消息
   */
  async deletePost(userId, postId) {
    const thePost = postRepository.findByIdRaw(postId);
    if (!thePost) {
      throw new AppError('Not found', 404);
    }

    if (thePost.author_id !== userId) {
      throw new AppError('Forbidden', 403);
    }

    postRepository.delete(postId);

    return {
      message: 'Post deleted successfully'
    };
  }
}

module.exports = new PostService();
