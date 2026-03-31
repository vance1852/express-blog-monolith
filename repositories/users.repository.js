const db = require("../config/database");

/**
 * 根据用户名或邮箱查找用户
 * @param {string} username - 用户名
 * @param {string} email - 邮箱
 * @returns {Object|null} 用户对象或 null
 */
function findByUsernameOrEmail(username, email) {
  return db
    .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .get(username, email);
}

/**
 * 根据邮箱查找用户
 * @param {string} email - 邮箱
 * @returns {Object|null} 用户对象或 null
 */
function findByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

/**
 * 根据ID查找用户
 * @param {number} id - 用户ID
 * @returns {Object|null} 用户对象或 null
 */
function findById(id) {
  return db
    .prepare(
      "SELECT id, username, email, bio, created_at FROM users WHERE id = ?"
    )
    .get(id);
}

/**
 * 创建新用户
 * @param {string} username - 用户名
 * @param {string} email - 邮箱
 * @param {string} password - 哈希后的密码
 * @returns {number} 新用户ID
 */
function create(username, email, password) {
  const result = db
    .prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)")
    .run(username, email, password);
  return result.lastInsertRowid;
}

/**
 * 更新用户信息
 * @param {number} id - 用户ID
 * @param {Object} updates - 更新字段
 * @param {string} [updates.username] - 用户名
 * @param {string} [updates.email] - 邮箱
 * @param {string} [updates.bio] - 个人简介
 * @param {string} [updates.password] - 哈希后的密码
 * @returns {void}
 */
function update(id, updates) {
  const fields = [];
  const values = [];

  if (updates.username !== undefined) {
    fields.push("username = ?");
    values.push(updates.username);
  }
  if (updates.email !== undefined) {
    fields.push("email = ?");
    values.push(updates.email);
  }
  if (updates.bio !== undefined) {
    fields.push("bio = ?");
    values.push(updates.bio);
  }
  if (updates.password !== undefined) {
    fields.push("password = ?");
    values.push(updates.password);
  }

  values.push(id);
  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
  db.prepare(sql).run(...values);
}

/**
 * 检查用户名是否已被其他用户使用
 * @param {string} username - 用户名
 * @param {number} excludeId - 排除的用户ID
 * @returns {Object|null} 冲突用户对象或 null
 */
function checkUsernameConflict(username, excludeId) {
  return db
    .prepare("SELECT id FROM users WHERE username = ? AND id != ?")
    .get(username, excludeId);
}

/**
 * 检查邮箱是否已被其他用户使用
 * @param {string} email - 邮箱
 * @param {number} excludeId - 排除的用户ID
 * @returns {Object|null} 冲突用户对象或 null
 */
function checkEmailConflict(email, excludeId) {
  return db
    .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
    .get(email, excludeId);
}

/**
 * 获取用户的文章数量
 * @param {number} userId - 用户ID
 * @returns {number} 文章数量
 */
function getPostCount(userId) {
  const result = db
    .prepare("SELECT COUNT(*) as count FROM posts WHERE author_id = ?")
    .get(userId);
  return result.count;
}

/**
 * 获取用户的评论数量
 * @param {number} userId - 用户ID
 * @returns {number} 评论数量
 */
function getCommentCount(userId) {
  const result = db
    .prepare("SELECT COUNT(*) as count FROM comments WHERE author_id = ?")
    .get(userId);
  return result.count;
}

module.exports = {
  findByUsernameOrEmail,
  findByEmail,
  findById,
  create,
  update,
  checkUsernameConflict,
  checkEmailConflict,
  getPostCount,
  getCommentCount,
};
