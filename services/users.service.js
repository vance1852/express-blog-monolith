const bcrypt = require("bcryptjs");
const usersRepository = require("../repositories/users.repository");

/**
 * 获取当前用户信息
 * @param {number} userId - 用户ID
 * @returns {{ id: number, username: string, email: string, bio: string, created_at: string, postCount: number, commentCount: number }} 用户信息
 * @throws {Error} 用户不存在时抛出错误
 */
function getCurrentUser(userId) {
  const user = usersRepository.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const postCount = usersRepository.getPostCount(userId);
  const commentCount = usersRepository.getCommentCount(userId);

  return {
    ...user,
    posts_count: postCount,
    comments_count: commentCount,
  };
}

/**
 * 更新用户资料
 * @param {number} userId - 用户ID
 * @param {Object} updates - 更新字段
 * @param {string} [updates.username] - 用户名
 * @param {string} [updates.email] - 邮箱
 * @param {string} [updates.bio] - 个人简介
 * @param {string} [updates.password] - 密码
 * @returns {{ message: string, user: Object }} 更新结果
 * @throws {Error} 验证失败时抛出错误
 */
function updateProfile(userId, updates) {
  const currentUser = usersRepository.findById(userId);
  if (!currentUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const updateData = {
    username: updates.username || currentUser.username,
    email: updates.email || currentUser.email,
    bio: updates.bio !== undefined ? updates.bio : currentUser.bio,
  };

  if (updates.username && updates.username !== currentUser.username) {
    const taken = usersRepository.checkUsernameConflict(
      updates.username,
      userId,
    );
    if (taken) {
      const error = new Error("Username already taken");
      error.statusCode = 409;
      throw error;
    }
  }

  if (updates.email && updates.email !== currentUser.email) {
    const emailTaken = usersRepository.checkEmailConflict(
      updates.email,
      userId,
    );
    if (emailTaken) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }
  }

  if (updates.password) {
    if (updates.password.length < 6) {
      const error = new Error("Password must be at least 6 characters");
      error.statusCode = 400;
      throw error;
    }
    updateData.password = bcrypt.hashSync(updates.password, 10);
  }

  usersRepository.update(userId, updateData);

  const updatedUser = usersRepository.findById(userId);
  return {
    message: "Profile updated",
    user: updatedUser,
  };
}

module.exports = {
  getCurrentUser,
  updateProfile,
};
