const db = require("../config/database");

/**
 * 获取文章列表（带分页）
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @param {number} [authorId] - 作者ID（可选）
 * @returns {{ posts: Array, total: number, totalPages: number }} 文章列表和分页信息
 */
function findAll(page, limit, authorId) {
  const offset = (page - 1) * limit;

  if (authorId) {
    const posts = db
      .prepare(
        `SELECT posts.*, users.username as author_name 
         FROM posts 
         JOIN users ON posts.author_id = users.id 
         WHERE posts.author_id = ? 
         ORDER BY posts.created_at DESC 
         LIMIT ? OFFSET ?`
      )
      .all(authorId, limit, offset);

    const totalResult = db
      .prepare("SELECT COUNT(*) as total FROM posts WHERE author_id = ?")
      .get(authorId);

    return {
      posts,
      total: totalResult.total,
      totalPages: Math.ceil(totalResult.total / limit),
    };
  }

  const posts = db
    .prepare(
      `SELECT posts.*, users.username as author_name 
       FROM posts 
       JOIN users ON posts.author_id = users.id 
       ORDER BY posts.created_at DESC 
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset);

  const totalResult = db.prepare("SELECT COUNT(*) as total FROM posts").get();

  return {
    posts,
    total: totalResult.total,
    totalPages: Math.ceil(totalResult.total / limit),
  };
}

/**
 * 根据ID获取文章（包含作者信息）
 * @param {number} id - 文章ID
 * @returns {Object|null} 文章对象或 null
 */
function findById(id) {
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
 * 创建新文章
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @param {number} authorId - 作者ID
 * @param {string} status - 状态
 * @returns {Object} 创建的文章对象
 */
function create(title, content, authorId, status) {
  const result = db
    .prepare(
      "INSERT INTO posts (title, content, author_id, status) VALUES (?, ?, ?, ?)"
    )
    .run(title, content, authorId, status);

  return findById(result.lastInsertRowid);
}

/**
 * 更新文章
 * @param {number} id - 文章ID
 * @param {Object} updates - 更新字段
 * @param {string} [updates.title] - 标题
 * @param {string} [updates.content] - 内容
 * @param {string} [updates.status] - 状态
 * @returns {Object} 更新后的文章对象
 */
function update(id, updates) {
  const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    fields.push("content = ?");
    values.push(updates.content);
  }
  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  const sql = `UPDATE posts SET ${fields.join(", ")} WHERE id = ?`;
  db.prepare(sql).run(...values);

  return findById(id);
}

/**
 * 删除文章
 * @param {number} id - 文章ID
 * @returns {void}
 */
function remove(id) {
  db.prepare("DELETE FROM posts WHERE id = ?").run(id);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
