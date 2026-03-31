const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { JWT_SECRET, JWT_EXPIRES_IN, SALT_ROUNDS } = require('../config');
const { AppError } = require('../middleware/errorHandler');

/**
 * 认证服务层
 */
class AuthService {
  /**
   * 用户注册
   * @param {string} username - 用户名
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @returns {Object} 注册结果，包含用户信息和 token
   */
  async register(username, email, password) {
    if (!username || !email || !password) {
      throw new AppError('All fields are required', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const existingUser = userRepository.findByUsernameOrEmail(username, email);
    if (existingUser) {
      throw new AppError('Username or email already exists', 409);
    }

    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const userId = userRepository.create(username, email, hashedPassword);

    const token = jwt.sign(
      { userId, username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      message: 'User registered successfully',
      user: { id: userId, username, email },
      token
    };
  }

  /**
   * 用户登录
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @returns {Object} 登录结果，包含用户信息和 token
   */
  async login(email, password) {
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio
      }
    };
  }
}

module.exports = new AuthService();
