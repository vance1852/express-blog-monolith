const express = require('express');
const userService = require('../services/userService');
const { authenticate } = require('../middleware/auth');
const asyncWrapper = require('../utils/asyncWrapper');

const router = express.Router();

/**
 * 获取当前用户信息
 * @route GET /api/users/me
 */
router.get(
  '/me',
  authenticate,
  asyncWrapper(async (req, res) => {
    const user = await userService.getCurrentUser(req.user.userId);
    res.json(user);
  })
);

/**
 * 更新用户资料
 * @route PUT /api/users/me
 */
router.put(
  '/me',
  authenticate,
  asyncWrapper(async (req, res) => {
    const result = await userService.updateProfile(req.user.userId, req.body);
    res.json(result);
  })
);

module.exports = router;
