const db = require('../config/database');

/**
 * 文章数据访问层
 */
class PostRepository {
  /**
   * 获取文章列表（带作者信息）
   * @param {number} limit - 每页数量
   * @param {number} offset - 偏移量
   * @returns {Array<Object>} 文章列表
   */
  findAll(limit, offset) {
    return db
      .prepare(
        `SELECT posts.*, users.username as author_name 
         FROM posts 
         JOIN users ON posts.author_id = users.id 
         ORDER BY posts.created_at DESC 
         LIMIT ? OFFSET ?`
      )
      .all(limit, offset);
  }

  /**
   * 根据作者 ID 获取文章列表
   * @param {number} authorId - 作者 ID
   * @param {number} limit - 每页数量
   * @param {number} offset - 偏移量
   * @returns {Array<Object>} 文章列表
   */
  findByAuthorId(authorId, limit, offset) {
    return db
      .prepare(
        `SELECT posts.*, users.username as author_name 
         FROM posts 
         JOIN users ON posts.author_id = users.id 
         WHERE posts.author_id = ?
         ORDER BY posts.created_at DESC 
         LIMIT ? OFFSET ?`
      )
      .all(authorId, limit, offset);
  }

  /**
   * 获取所有文章总数
   * @returns {number} 文章总数
   */
  countAll() {
    return db.prepare('SELECT COUNT(*) as total FROM posts').get().total;
  }

  /**
   * 获取指定作者的文章总数
   * @param {number} authorId - 作者 ID
   * @returns {number} 文章总数
   */
  countByAuthorId(authorId) {
    return db
      .prepare('SELECT COUNT(*) as total FROM posts WHERE author_id = ?')
      .get(authorId).total;
  }

  /**
   * 根据 ID 查找文章（带作者信息）
   * @param {number} id - 文章 ID
   * @returns {Object|null} 文章对象或 null
   */
  findById(id) {
    return db
      .prepare(
        `SELECT posts.*, users.username as author_name 
         FROM posts 
         JOIN users ON posts.author_id = users.id 
         WHERE posts.id = ?`
      )
      .get(id);
  }

  /**
   * 根据 ID 查找文章（不含关联信息）
   * @param {number} id - 文章 ID
   * @returns {Object|null} 文章对象或 null
   */
  findByIdRaw(id) {
    return db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  }

  /**
   * 创建新文章
   * @param {string} title - 标题
   * @param {string} content - 内容
   * @param {number} authorId - 作者 ID
   * @param {string} status - 状态
   * @returns {number} 新文章 ID
   */
  create(title, content, authorId, status) {
    const result = db
      .prepare(
        'INSERT INTO posts (title, content, author_id, status) VALUES (?, ?, ?, ?)'
      )
      .run(title, content, authorId, status);
    return result.lastInsertRowid;
  }

  /**
   * 更新文章
   * @param {number} id - 文章 ID
   * @param {string} title - 标题
   * @param {string} content - 内容
   * @param {string} status - 状态
   */
  update(id, title, content, status) {
    db.prepare(
      `UPDATE posts SET title = ?, content = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(title, content, status, id);
  }

  /**
   * 删除文章
   * @param {number} id - 文章 ID
   */
  delete(id) {
    db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  }

  /**
   * 检查文章是否存在
   * @param {number} id - 文章 ID
   * @returns {boolean} 是否存在
   */
  exists(id) {
    const result = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
    return !!result;
  }
}

module.exports = new PostRepository();
