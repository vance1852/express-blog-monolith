const postsRepository = require("../repositories/posts.repository");
const commentsRepository = require("../repositories/comments.repository");

/**
 * 获取文章列表
 * @param {Object} query - 查询参数
 * @param {number} [query.page=1] - 页码
 * @param {number} [query.limit=10] - 每页数量
 * @param {number} [query.author_id] - 作者ID（可选）
 * @returns {{ posts: Array, pagination: { page: number, limit: number, total: number, totalPages: number } }} 文章列表和分页信息
 */
function getPosts(query) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const authorId = query.author_id;

  const result = postsRepository.findAll(page, limit, authorId);

  return {
    data: result.posts,
    total: result.total,
    page,
    limit,
  };
}

/**
 * 获取文章详情
 * @param {number} id - 文章ID
 * @returns {Object} 文章详情（包含评论）
 * @throws {Error} 文章不存在时抛出错误
 */
function getPostById(id) {
  const post = postsRepository.findById(id);
  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  const commentsResult = commentsRepository.findByPostId(id, 1, 1000);

  return {
    ...post,
    comments: commentsResult.comments,
  };
}

/**
 * 创建文章
 * @param {number} userId - 用户ID
 * @param {Object} data - 文章数据
 * @param {string} data.title - 标题
 * @param {string} data.content - 内容
 * @param {string} [data.status='published'] - 状态
 * @returns {Object} 创建的文章
 * @throws {Error} 验证失败时抛出错误
 */
function createPost(userId, data) {
  if (!data.title || !data.content) {
    const error = new Error("Title and content are required");
    error.statusCode = 400;
    throw error;
  }

  const postStatus = data.status || "published";
  const post = postsRepository.create(
    data.title,
    data.content,
    userId,
    postStatus,
  );
  return { post };
}

/**
 * 更新文章
 * @param {number} userId - 用户ID
 * @param {number} postId - 文章ID
 * @param {Object} data - 更新数据
 * @param {string} [data.title] - 标题
 * @param {string} [data.content] - 内容
 * @param {string} [data.status] - 状态
 * @returns {Object} 更新后的文章
 * @throws {Error} 验证失败时抛出错误
 */
function updatePost(userId, postId, data) {
  const existing = postsRepository.findById(postId);
  if (!existing) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  if (existing.author_id !== userId) {
    const error = new Error("You can only edit your own posts");
    error.statusCode = 403;
    throw error;
  }

  const updates = {
    title: data.title || existing.title,
    content: data.content || existing.content,
    status: data.status || existing.status,
  };

  const post = postsRepository.update(postId, updates);
  return { post };
}

/**
 * 删除文章
 * @param {number} userId - 用户ID
 * @param {number} postId - 文章ID
 * @returns {{ message: string }} 删除结果
 * @throws {Error} 验证失败时抛出错误
 */
function deletePost(userId, postId) {
  const thePost = postsRepository.findById(postId);
  if (!thePost) {
    const error = new Error("Not found");
    error.statusCode = 404;
    throw error;
  }

  if (thePost.author_id !== userId) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  postsRepository.remove(postId);
  return { message: "Post deleted successfully" };
}

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};
