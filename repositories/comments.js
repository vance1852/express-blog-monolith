const { getDatabase } = require("../config/database");

/**
 * 评论数据访问层
 */
class CommentRepository {
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
   * 根据ID查找评论
   * @param {number} id - 评论ID
   * @returns {Object|null} 评论对象
   */
  findById(id) {
    return this.db.prepare("SELECT * FROM comments WHERE id = ?").get(id);
  }

  /**
   * 根据ID查找评论（包含作者名）
   * @param {number} id - 评论ID
   * @returns {Object|null} 评论对象
   */
  findByIdWithAuthor(id) {
    return this.db
      .prepare(
        `SELECT comments.*, users.username as author_name 
         FROM comments 
         JOIN users ON comments.author_id = users.id 
         WHERE comments.id = ?`,
      )
      .get(id);
  }

  /**
   * 获取文章的评论列表
   * @param {number} postId - 文章ID
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.limit - 每页数量
   * @returns {Object} 包含评论列表和分页信息
   */
  findByPostId(postId, options) {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    const comments = this.db
      .prepare(
        `SELECT comments.*, users.username as author_name 
         FROM comments 
         JOIN users ON comments.author_id = users.id 
         WHERE comments.post_id = ? 
         ORDER BY comments.created_at ASC 
         LIMIT ? OFFSET ?`,
      )
      .all(postId, limit, offset);

    const totalResult = this.db
      .prepare("SELECT COUNT(*) as total FROM comments WHERE post_id = ?")
      .get(postId);

    return {
      comments,
      pagination: {
        page,
        limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit),
      },
    };
  }

  /**
   * 检查文章是否存在
   * @param {number} postId - 文章ID
   * @returns {Object|null} 文章对象（仅ID）
   */
  checkPostExists(postId) {
    return this.db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);
  }

  /**
   * 创建评论
   * @param {Object} commentData - 评论数据
   * @returns {Object} 插入结果
   */
  create(commentData) {
    const { content, postId, authorId } = commentData;
    return this.db
      .prepare(
        "INSERT INTO comments (content, post_id, author_id) VALUES (?, ?, ?)",
      )
      .run(content, postId, authorId);
  }

  /**
   * 删除评论
   * @param {number} id - 评论ID
   * @returns {Object} 删除结果
   */
  delete(id) {
    return this.db.prepare("DELETE FROM comments WHERE id = ?").run(id);
  }
}

module.exports = new CommentRepository();
