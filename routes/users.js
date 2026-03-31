const express = require("express");
const userService = require("../services/users");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * @route GET /api/users/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = userService.getCurrentUser(req.user.userId);
    res.json(user);
  }),
);

/**
 * @route PUT /api/users/me
 * @desc 更新当前用户信息
 * @access Private
 */
router.put(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const result = userService.updateCurrentUser(req.user.userId, req.body);
    res.json(result);
  }),
);

module.exports = router;
