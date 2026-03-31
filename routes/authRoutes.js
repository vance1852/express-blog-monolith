const express = require('express');
const authService = require('../services/authService');
const asyncWrapper = require('../utils/asyncWrapper');

const router = express.Router();

/**
 * 用户注册
 * @route POST /api/auth/register
 */
router.post(
  '/register',
  asyncWrapper(async (req, res) => {
    const { username, email, password } = req.body;
    const result = await authService.register(username, email, password);
    res.status(201).json(result);
  })
);

/**
 * 用户登录
 * @route POST /api/auth/login
 */
router.post(
  '/login',
  asyncWrapper(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  })
);

module.exports = router;
