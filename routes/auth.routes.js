const express = require("express");
const authService = require("../services/auth.service");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

/**
 * 用户注册
 * @route POST /api/auth/register
 */
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    try {
      const result = authService.register(
        req.body.username,
        req.body.email,
        req.body.password
      );
      res.status(201).json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  })
);

/**
 * 用户登录
 * @route POST /api/auth/login
 */
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    try {
      const result = authService.login(req.body.email, req.body.password);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message });
    }
  })
);

module.exports = router;
