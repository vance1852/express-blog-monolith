const express = require('express');
const postService = require('../services/postService');
const commentService = require('../services/commentService');
const { authenticate } = require('../middleware/auth');
const asyncWrapper = require('../utils/asyncWrapper');

const router = express.Router();

/**
 * 获取文章列表
 * @route GET /api/posts
 */
router.get(
  '/',
  asyncWrapper(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const author_id = req.query.author_id;
    const result = await postService.getPosts(page, limit, author_id);
    res.json(result);
  })
);

/**
 * 获取单篇文章
 * @route GET /api/posts/:id
 */
router.get(
  '/:id',
  asyncWrapper(async (req, res) => {
    const post = await postService.getPostById(req.params.id);
    res.json(post);
  })
);

/**
 * 创建文章
 * @route POST /api/posts
 */
router.post(
  '/',
  authenticate,
  asyncWrapper(async (req, res) => {
    const { title, content, status } = req.body;
    const newPost = await postService.createPost(
      req.user.userId,
      title,
      content,
      status
    );
    res.status(201).json(newPost);
  })
);

/**
 * 更新文章
 * @route PUT /api/posts/:id
 */
router.put(
  '/:id',
  authenticate,
  asyncWrapper(async (req, res) => {
    const { title, content, status } = req.body;
    const updatedPost = await postService.updatePost(
      req.user.userId,
      req.params.id,
      title,
      content,
      status
    );
    res.json(updatedPost);
  })
);

/**
 * 删除文章
 * @route DELETE /api/posts/:id
 */
router.delete(
  '/:id',
  authenticate,
  asyncWrapper(async (req, res) => {
    const result = await postService.deletePost(req.user.userId, req.params.id);
    res.json(result);
  })
);

/**
 * 获取文章评论
 * @route GET /api/posts/:id/comments
 */
router.get(
  '/:id/comments',
  asyncWrapper(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const comments = await commentService.getCommentsByPostId(
      req.params.id,
      page,
      limit
    );
    res.json(comments);
  })
);

/**
 * 添加评论
 * @route POST /api/posts/:id/comments
 */
router.post(
  '/:id/comments',
  authenticate,
  asyncWrapper(async (req, res) => {
    const { content } = req.body;
    const newComment = await commentService.createComment(
      req.user.userId,
      req.params.id,
      content
    );
    res.status(201).json(newComment);
  })
);

module.exports = router;
