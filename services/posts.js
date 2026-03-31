const postRepository = require("../repositories/posts");
const commentRepository = require("../repositories/comments");
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../middleware/errorHandler");

/**
 * 文章服务层
 */
class PostService {
  /**
   * 获取文章列表
   * @param {Object} query - 查询参数
   * @param {string} [query.page] - 页码
   * @param {string} [query.limit] - 每页数量
   * @param {string} [query.author_id] - 作者ID
   * @returns {Object} 包含文章列表和分页信息
   */
  getPosts(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const authorId = query.author_id ? parseInt(query.author_id) : undefined;

    return postRepository.findAll({ page, limit, authorId });
  }

  /**
   * 获取单篇文章详情（包含评论）
   * @param {number} postId - 文章ID
   * @returns {Object} 文章详情（包含评论）
   */
  getPostById(postId) {
    const post = postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Post not found");
    }

    const comments = postRepository.getComments(postId);
    return { ...post, comments };
  }

  /**
   * 创建文章
   * @param {number} userId - 用户ID
   * @param {Object} postData - 文章数据
   * @returns {Object} 创建的文章
   */
  createPost(userId, postData) {
    const { title, content, status } = postData;

    if (!title || !content) {
      throw new BadRequestError("Title and content are required");
    }

    const postStatus = status || "published";
    const result = postRepository.create({ title, content, authorId: userId, status: postStatus });

    return postRepository.findById(result.lastInsertRowid);
  }

  /**
   * 更新文章
   * @param {number} userId - 用户ID
   * @param {number} postId - 文章ID
   * @param {Object} postData - 文章数据
   * @returns {Object} 更新后的文章
   */
  updatePost(userId, postId, postData) {
    const existing = postRepository.findByIdSimple(postId);
    if (!existing) {
      throw new NotFoundError("Post not found");
    }

    if (existing.author_id !== userId) {
      throw new ForbiddenError("You can only edit your own posts");
    }

    const updatedTitle = postData.title || existing.title;
    const updatedContent = postData.content || existing.content;
    const updatedStatus = postData.status || existing.status;

    postRepository.update(postId, { title: updatedTitle, content: updatedContent, status: updatedStatus });

    return postRepository.findById(postId);
  }

  /**
   * 删除文章
   * @param {number} userId - 用户ID
   * @param {number} postId - 文章ID
   * @returns {Object} 删除消息
   */
  deletePost(userId, postId) {
    const thePost = postRepository.findByIdSimple(postId);
    if (!thePost) {
      throw new NotFoundError("Post not found");
    }

    if (thePost.author_id !== userId) {
      throw new ForbiddenError("Forbidden");
    }

    postRepository.delete(postId);
    return { message: "Post deleted successfully" };
  }
}

module.exports = new PostService();
