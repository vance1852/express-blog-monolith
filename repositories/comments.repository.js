const db = require("../config/database");

/**
 * 获取文章的评论列表（带分页）
 * @param {number} postId - 文章ID
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @returns {{ comments: Array, total: number, totalPages: number }} 评论列表和分页信息
 */
function findByPostId(postId, page, limit) {
  const offset = (page - 1) * limit;

  const comments = db
    .prepare(
      `SELECT comments.*, users.username as author_name 
       FROM comments 
       JOIN users ON comments.author_id = users.id 
       WHERE comments.post_id = ? 
       ORDER BY comments.created_at ASC 
       LIMIT ? OFFSET ?`
    )
    .all(postId, limit, offset);

  const totalResult = db
    .prepare("SELECT COUNT(*) as total FROM comments WHERE post_id = ?")
    .get(postId);

  return {
    comments,
    total: totalResult.total,
    totalPages: Math.ceil(totalResult.total / limit),
  };
}

/**
 * 根据ID获取评论
 * @param {number} id - 评论ID
 * @returns {Object|null} 评论对象或 null
 */
function findById(id) {
  return db.prepare("SELECT * FROM comments WHERE id = ?").get(id);
}

/**
 * 创建新评论
 * @param {string} content - 评论内容
 * @param {number} postId - 文章ID
 * @param {number} authorId - 作者ID
 * @returns {Object} 创建的评论对象
 */
function create(content, postId, authorId) {
  const result = db
    .prepare(
      "INSERT INTO comments (content, post_id, author_id) VALUES (?, ?, ?)"
    )
    .run(content, postId, authorId);

  return db
    .prepare(
      `SELECT comments.*, users.username as author_name 
       FROM comments 
       JOIN users ON comments.author_id = users.id 
       WHERE comments.id = ?`
    )
    .get(result.lastInsertRowid);
}

/**
 * 删除评论
 * @param {number} id - 评论ID
 * @returns {void}
 */
function remove(id) {
  db.prepare("DELETE FROM comments WHERE id = ?").run(id);
}

/**
 * 检查文章是否存在
 * @param {number} postId - 文章ID
 * @returns {boolean} 文章是否存在
 */
function postExists(postId) {
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);
  return !!post;
}

module.exports = {
  findByPostId,
  findById,
  create,
  remove,
  postExists,
};
