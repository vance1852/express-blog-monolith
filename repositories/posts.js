const { getDatabase } = require("../config/database");

/**
 * 文章数据访问层
 */
class PostRepository {
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
   * 根据ID查找文章
   * @param {number} id - 文章ID
   * @returns {Object|null} 文章对象（包含作者名）
   */
  findById(id) {
    return this.db
      .prepare(
        `SELECT posts.*, users.username as author_name 
         FROM posts 
         JOIN users ON posts.author_id = users.id 
         WHERE posts.id = ?`,
      )
      .get(id);
  }

  /**
   * 查找文章（无作者信息）
   * @param {number} id - 文章ID
   * @returns {Object|null} 文章对象
   */
  findByIdSimple(id) {
    return this.db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  }

  /**
   * 获取文章列表
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.limit - 每页数量
   * @param {number} [options.authorId] - 作者ID（可选）
   * @returns {Object} 包含文章列表和分页信息
   */
  findAll(options) {
    const { page, limit, authorId } = options;
    const offset = (page - 1) * limit;

    let posts;
    let totalResult;

    if (authorId) {
      const query = `SELECT posts.*, users.username as author_name 
         FROM posts 
         JOIN users ON posts.author_id = users.id 
         WHERE posts.author_id = ? 
         ORDER BY posts.created_at DESC 
         LIMIT ? OFFSET ?`;
      const countQuery =
        "SELECT COUNT(*) as total FROM posts WHERE author_id = ?";
      posts = this.db.prepare(query).all(authorId, limit, offset);
      totalResult = this.db.prepare(countQuery).get(authorId);
    } else {
      posts = this.db
        .prepare(
          `SELECT posts.*, users.username as author_name 
           FROM posts 
           JOIN users ON posts.author_id = users.id 
           ORDER BY posts.created_at DESC 
           LIMIT ? OFFSET ?`,
        )
        .all(limit, offset);
      totalResult = this.db
        .prepare("SELECT COUNT(*) as total FROM posts")
        .get();
    }

    return {
      posts,
      pagination: {
        page,
        limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit),
      },
    };
  }

  /**
   * 创建文章
   * @param {Object} postData - 文章数据
   * @returns {Object} 插入结果
   */
  create(postData) {
    const { title, content, authorId, status } = postData;
    return this.db
      .prepare(
        "INSERT INTO posts (title, content, author_id, status) VALUES (?, ?, ?, ?)",
      )
      .run(title, content, authorId, status);
  }

  /**
   * 更新文章
   * @param {number} id - 文章ID
   * @param {Object} postData - 文章数据
   * @returns {Object} 更新结果
   */
  update(id, postData) {
    const { title, content, status } = postData;
    return this.db
      .prepare(
        `UPDATE posts SET title = ?, content = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      )
      .run(title, content, status, id);
  }

  /**
   * 删除文章
   * @param {number} id - 文章ID
   * @returns {Object} 删除结果
   */
  delete(id) {
    return this.db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  }

  /**
   * 获取文章的评论列表
   * @param {number} postId - 文章ID
   * @returns {Array} 评论数组
   */
  getComments(postId) {
    return this.db
      .prepare(
        `SELECT comments.*, users.username as author_name 
         FROM comments 
         JOIN users ON comments.author_id = users.id 
         WHERE comments.post_id = ? 
         ORDER BY comments.created_at ASC`,
      )
      .all(postId);
  }
}

module.exports = new PostRepository();
