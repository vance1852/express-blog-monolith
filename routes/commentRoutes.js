const express = require('express');
const commentService = require('../services/commentService');
const { authenticate } = require('../middleware/auth');
const asyncWrapper = require('../utils/asyncWrapper');

const router = express.Router();

/**
 * 删除评论
 * @route DELETE /api/comments/:id
 */
router.delete(
  '/:id',
  authenticate,
  asyncWrapper(async (req, res) => {
    const result = await commentService.deleteComment(
      req.user.userId,
      req.params.id
    );
    res.json(result);
  })
);

module.exports = router;
