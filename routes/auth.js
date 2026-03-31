const express = require("express");
const userService = require("../services/users");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc 用户注册
 * @access Public
 */
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const result = userService.register(req.body);
    res.status(201).json(result);
  }),
);

/**
 * @route POST /api/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const result = userService.login(req.body);
    res.json(result);
  }),
);

module.exports = router;
