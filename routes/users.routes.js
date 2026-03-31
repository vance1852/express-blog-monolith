const express = require("express");
const usersService = require("../services/users.service");
const authenticate = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

/**
 * 获取当前用户信息
 * @route GET /api/users/me
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const user = usersService.getCurrentUser(req.user.userId);
      res.json(user);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  })
);

/**
 * 更新当前用户资料
 * @route PUT /api/users/me
 */
router.put(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    try {
      const result = usersService.updateProfile(req.user.userId, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  })
);

module.exports = router;
