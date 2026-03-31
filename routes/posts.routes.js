const express = require("express");
const postsService = require("../services/posts.service");
const commentsService = require("../services/comments.service");
const authenticate = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

/**
 * 获取文章列表
 * @route GET /api/posts
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = postsService.getPosts(req.query);
    res.json(result);
  })
);

/**
 * 获取文章详情
 * @route GET /api/posts/:id
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const post = postsService.getPostById(req.params.id);
      res.json(post);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  })
);

/**
 * 创建文章
 * @route POST /api/posts
 */
router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const post = postsService.createPost(req.user.userId, req.body);
      res.status(201).json(post);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  })
);

/**
 * 更新文章
 * @route PUT /api/posts/:id
 */
router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const post = postsService.updatePost(
        req.user.userId,
        req.params.id,
        req.body
      );
      res.json(post);
    } catch (err) {
      res.status(err.statusCode || 500).json({ msg: err.message });
    }
  })
);

/**
 * 删除文章
 * @route DELETE /api/posts/:id
 */
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const result = postsService.deletePost(req.user.userId, req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  })
);

/**
 * 获取文章评论
 * @route GET /api/posts/:id/comments
 */
router.get(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    try {
      const result = commentsService.getCommentsByPostId(req.params.id, req.query);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  })
);

/**
 * 添加评论
 * @route POST /api/posts/:id/comments
 */
router.post(
  "/:id/comments",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const comment = commentsService.addComment(
        req.user.userId,
        req.params.id,
        req.body.content
      );
      res.status(201).json(comment);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message });
    }
  })
);

module.exports = router;
