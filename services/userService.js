const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const { SALT_ROUNDS } = require('../config');
const { AppError } = require('../middleware/errorHandler');

/**
 * 用户服务层
 */
class UserService {
  /**
   * 获取当前用户信息（包含统计数据）
   * @param {number} userId - 用户 ID
   * @returns {Object} 用户信息和统计数据
   */
  async getCurrentUser(userId) {
    const user = userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const postCount = userRepository.getPostCount(userId);
    const commentCount = userRepository.getCommentCount(userId);

    return {
      ...user,
      postCount,
      commentCount
    };
  }

  /**
   * 更新用户资料
   * @param {number} userId - 用户 ID
   * @param {Object} updateData - 更新数据
   * @param {string} updateData.username - 新用户名
   * @param {string} updateData.email - 新邮箱
   * @param {string} updateData.bio - 新个人简介
   * @param {string} updateData.password - 新密码（可选）
   * @returns {Object} 更新后的用户信息
   */
  async updateProfile(userId, { username, email, bio, password }) {
    const currentUser = userRepository.findByIdWithPassword(userId);
    if (!currentUser) {
      throw new AppError('User not found', 404);
    }

    const newUsername = username || currentUser.username;
    const newEmail = email || currentUser.email;
    const newBio = bio !== undefined ? bio : currentUser.bio;

    if (username && username !== currentUser.username) {
      const taken = userRepository.checkUsernameExists(username, userId);
      if (taken) {
        throw new AppError('Username already taken', 409);
      }
    }

    if (email && email !== currentUser.email) {
      const emailTaken = userRepository.checkEmailExists(email, userId);
      if (emailTaken) {
        throw new AppError('Email already in use', 409);
      }
    }

    if (password) {
      if (password.length < 6) {
        throw new AppError('Password must be at least 6 characters', 400);
      }
      const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
      userRepository.updateWithPassword(
        userId,
        newUsername,
        newEmail,
        newBio,
        hashedPassword
      );
    } else {
      userRepository.update(userId, newUsername, newEmail, newBio);
    }

    const updatedUser = userRepository.findById(userId);
    return {
      message: 'Profile updated',
      user: updatedUser
    };
  }
}

module.exports = new UserService();
