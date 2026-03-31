const db = require('../config/database');

/**
 * 评论数据访问层
 */
class CommentRepository {
  /**
   * 根据文章 ID 获取评论列表（带作者信息）
   * @param {number} postId - 文章 ID
   * @param {number} limit - 每页数量
   * @param {number} offset - 偏移量
   * @returns {Array<Object>} 评论列表
   */
  findByPostId(postId, limit, offset) {
    return db
      .prepare(
        `SELECT comments.*, users.username as author_name 
         FROM comments 
         JOIN users ON comments.author_id = users.id 
         WHERE comments.post_id = ? 
         ORDER BY comments.created_at ASC 
         LIMIT ? OFFSET ?`
      )
      .all(postId, limit, offset);
  }

  /**
   * 获取文章的评论总数
   * @param {number} postId - 文章 ID
   * @returns {number} 评论总数
   */
  countByPostId(postId) {
    return db
      .prepare('SELECT COUNT(*) as total FROM comments WHERE post_id = ?')
      .get(postId).total;
  }

  /**
   * 根据 ID 查找评论
   * @param {number} id - 评论 ID
   * @returns {Object|null} 评论对象或 null
   */
  findById(id) {
    return db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
  }

  /**
   * 根据 ID 查找评论（带作者信息）
   * @param {number} id - 评论 ID
   * @returns {Object|null} 评论对象或 null
   */
  findByIdWithAuthor(id) {
    return db
      .prepare(
        `SELECT comments.*, users.username as author_name 
         FROM comments 
         JOIN users ON comments.author_id = users.id 
         WHERE comments.id = ?`
      )
      .get(id);
  }

  /**
   * 创建新评论
   * @param {string} content - 评论内容
   * @param {number} postId - 文章 ID
   * @param {number} authorId - 作者 ID
   * @returns {number} 新评论 ID
   */
  create(content, postId, authorId) {
    const result = db
      .prepare(
        'INSERT INTO comments (content, post_id, author_id) VALUES (?, ?, ?)'
      )
      .run(content, postId, authorId);
    return result.lastInsertRowid;
  }

  /**
   * 删除评论
   * @param {number} id - 评论 ID
   */
  delete(id) {
    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
  }
}

module.exports = new CommentRepository();
