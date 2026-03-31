const express = require("express");
const commentService = require("../services/comments");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * @route GET /api/posts/:id/comments
 * @desc 获取文章的评论列表
 * @access Public
 */
router.get(
  "/posts/:id/comments",
  asyncHandler(async (req, res) => {
    const result = commentService.getCommentsByPostId(parseInt(req.params.id), req.query);
    res.json(result);
  }),
);

/**
 * @route POST /api/posts/:id/comments
 * @desc 为文章添加评论
 * @access Private
 */
router.post(
  "/posts/:id/comments",
  authenticate,
  asyncHandler(async (req, res) => {
    const comment = commentService.createComment(
      req.user.userId,
      parseInt(req.params.id),
      req.body,
    );
    res.status(201).json(comment);
  }),
);

/**
 * @route DELETE /api/comments/:id
 * @desc 删除评论
 * @access Private
 */
router.delete(
  "/comments/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = commentService.deleteComment(req.user.userId, parseInt(req.params.id));
    res.json(result);
  }),
);

module.exports = router;
