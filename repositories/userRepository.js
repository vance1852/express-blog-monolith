const db = require('../config/database');

/**
 * 用户数据访问层
 */
class UserRepository {
  /**
   * 根据用户名或邮箱查找用户
   * @param {string} username - 用户名
   * @param {string} email - 邮箱
   * @returns {Object|null} 用户对象或 null
   */
  findByUsernameOrEmail(username, email) {
    return db
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email);
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email - 邮箱
   * @returns {Object|null} 用户对象或 null
   */
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  /**
   * 根据 ID 查找用户（返回安全字段）
   * @param {number} id - 用户 ID
   * @returns {Object|null} 用户对象或 null
   */
  findById(id) {
    return db
      .prepare(
        'SELECT id, username, email, bio, created_at FROM users WHERE id = ?'
      )
      .get(id);
  }

  /**
   * 根据 ID 查找用户（包含所有字段，用于验证）
   * @param {number} id - 用户 ID
   * @returns {Object|null} 用户对象或 null
   */
  findByIdWithPassword(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  /**
   * 创建新用户
   * @param {string} username - 用户名
   * @param {string} email - 邮箱
   * @param {string} hashedPassword - 哈希后的密码
   * @returns {number} 新用户 ID
   */
  create(username, email, hashedPassword) {
    const result = db
      .prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)')
      .run(username, email, hashedPassword);
    return result.lastInsertRowid;
  }

  /**
   * 检查用户名是否已被其他用户使用
   * @param {string} username - 用户名
   * @param {number} excludeUserId - 排除的用户 ID
   * @returns {Object|null} 存在的用户对象或 null
   */
  checkUsernameExists(username, excludeUserId) {
    return db
      .prepare('SELECT id FROM users WHERE username = ? AND id != ?')
      .get(username, excludeUserId);
  }

  /**
   * 检查邮箱是否已被其他用户使用
   * @param {string} email - 邮箱
   * @param {number} excludeUserId - 排除的用户 ID
   * @returns {Object|null} 存在的用户对象或 null
   */
  checkEmailExists(email, excludeUserId) {
    return db
      .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
      .get(email, excludeUserId);
  }

  /**
   * 更新用户信息（含密码）
   * @param {number} id - 用户 ID
   * @param {string} username - 用户名
   * @param {string} email - 邮箱
   * @param {string} bio - 个人简介
   * @param {string} hashedPassword - 哈希后的密码
   */
  updateWithPassword(id, username, email, bio, hashedPassword) {
    db.prepare(
      'UPDATE users SET username = ?, email = ?, bio = ?, password = ? WHERE id = ?'
    ).run(username, email, bio, hashedPassword, id);
  }

  /**
   * 更新用户信息（不含密码）
   * @param {number} id - 用户 ID
   * @param {string} username - 用户名
   * @param {string} email - 邮箱
   * @param {string} bio - 个人简介
   */
  update(id, username, email, bio) {
    db.prepare(
      'UPDATE users SET username = ?, email = ?, bio = ? WHERE id = ?'
    ).run(username, email, bio, id);
  }

  /**
   * 获取用户文章数量
   * @param {number} userId - 用户 ID
   * @returns {number} 文章数量
   */
  getPostCount(userId) {
    return db
      .prepare('SELECT COUNT(*) as count FROM posts WHERE author_id = ?')
      .get(userId).count;
  }

  /**
   * 获取用户评论数量
   * @param {number} userId - 用户 ID
   * @returns {number} 评论数量
   */
  getCommentCount(userId) {
    return db
      .prepare('SELECT COUNT(*) as count FROM comments WHERE author_id = ?')
      .get(userId).count;
  }
}

module.exports = new UserRepository();
