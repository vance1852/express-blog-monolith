const express = require("express");
const commentsService = require("../services/comments.service");
const authenticate = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

/**
 * 删除评论
 * @route DELETE /api/comments/:id
 */
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const result = commentsService.deleteComment(
        req.user.userId,
        req.params.id
      );
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  })
);

module.exports = router;
