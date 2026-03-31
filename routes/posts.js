const express = require("express");
const postService = require("../services/posts");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * @route GET /api/posts
 * @desc 获取文章列表
 * @access Public
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = postService.getPosts(req.query);
    res.json(result);
  }),
);

/**
 * @route GET /api/posts/:id
 * @desc 获取单篇文章详情
 * @access Public
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const post = postService.getPostById(parseInt(req.params.id));
    res.json(post);
  }),
);

/**
 * @route POST /api/posts
 * @desc 创建文章
 * @access Private
 */
router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const post = postService.createPost(req.user.userId, req.body);
    res.status(201).json(post);
  }),
);

/**
 * @route PUT /api/posts/:id
 * @desc 更新文章
 * @access Private
 */
router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const post = postService.updatePost(req.user.userId, parseInt(req.params.id), req.body);
    res.json(post);
  }),
);

/**
 * @route DELETE /api/posts/:id
 * @desc 删除文章
 * @access Private
 */
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = postService.deletePost(req.user.userId, parseInt(req.params.id));
    res.json(result);
  }),
);

module.exports = router;
