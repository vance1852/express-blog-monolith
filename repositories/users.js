const { getDatabase } = require("../config/database");

/**
 * 用户数据访问层
 */
class UserRepository {
  constructor() {
    this._db = null;
  }

  get db() {
    if (!this._db) {
      this._db = getDatabase();
    }
    return this._db;
  }

  /**
   * 根据ID查找用户
   * @param {number} id - 用户ID
   * @returns {Object|null} 用户对象
   */
  findById(id) {
    return this.db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email - 用户邮箱
   * @returns {Object|null} 用户对象
   */
  findByEmail(email) {
    return this.db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  }

  /**
   * 根据用户名或邮箱查找用户
   * @param {string} username - 用户名
   * @param {string} email - 邮箱
   * @returns {Object|null} 用户对象
   */
  findByUsernameOrEmail(username, email) {
    return this.db
      .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
      .get(username, email);
  }

  /**
   * 根据用户名查找用户（排除指定ID）
   * @param {string} username - 用户名
   * @param {number} excludeId - 排除的用户ID
   * @returns {Object|null} 用户对象
   */
  findByUsernameExcludeId(username, excludeId) {
    return this.db
      .prepare("SELECT id FROM users WHERE username = ? AND id != ?")
      .get(username, excludeId);
  }

  /**
   * 根据邮箱查找用户（排除指定ID）
   * @param {string} email - 邮箱
   * @param {number} excludeId - 排除的用户ID
   * @returns {Object|null} 用户对象
   */
  findByEmailExcludeId(email, excludeId) {
    return this.db
      .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
      .get(email, excludeId);
  }

  /**
   * 创建用户
   * @param {Object} userData - 用户数据
   * @param {string} userData.username - 用户名
   * @param {string} userData.email - 邮箱
   * @param {string} userData.password - 密码
   * @returns {Object} 插入结果
   */
  create(userData) {
    const { username, email, password } = userData;
    return this.db
      .prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)")
      .run(username, email, password);
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} userData - 用户数据
   * @returns {Object} 更新结果
   */
  update(id, userData) {
    const { username, email, bio, password } = userData;
    if (password) {
      return this.db
        .prepare(
          "UPDATE users SET username = ?, email = ?, bio = ?, password = ? WHERE id = ?",
        )
        .run(username, email, bio, password, id);
    } else {
      return this.db
        .prepare(
          "UPDATE users SET username = ?, email = ?, bio = ? WHERE id = ?",
        )
        .run(username, email, bio, id);
    }
  }

  /**
   * 获取用户的文章数量
   * @param {number} userId - 用户ID
   * @returns {Object} 包含 count 字段的对象
   */
  getPostCount(userId) {
    return this.db
      .prepare("SELECT COUNT(*) as count FROM posts WHERE author_id = ?")
      .get(userId);
  }

  /**
   * 获取用户的评论数量
   * @param {number} userId - 用户ID
   * @returns {Object} 包含 count 字段的对象
   */
  getCommentCount(userId) {
    return this.db
      .prepare("SELECT COUNT(*) as count FROM comments WHERE author_id = ?")
      .get(userId);
  }
}

module.exports = new UserRepository();
