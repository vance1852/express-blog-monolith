const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/users");
const { JWT_SECRET } = require("../middleware/auth");
const {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} = require("../middleware/errorHandler");

/**
 * 用户服务层
 */
class UserService {
  /**
   * 用户注册
   * @param {Object} userData - 用户数据
   * @param {string} userData.username - 用户名
   * @param {string} userData.email - 邮箱
   * @param {string} userData.password - 密码
   * @returns {Object} 包含用户信息和 token 的对象
   */
  register(userData) {
    const { username, email, password } = userData;

    if (!username || !email || !password) {
      throw new BadRequestError("All fields are required");
    }

    if (password.length < 6) {
      throw new BadRequestError("Password must be at least 6 characters");
    }

    const existingUser = userRepository.findByUsernameOrEmail(username, email);
    if (existingUser) {
      throw new ConflictError("Username or email already exists");
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = userRepository.create({ username, email, password: hashedPassword });

    const token = jwt.sign(
      { userId: result.lastInsertRowid, username: username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return {
      message: "User registered successfully",
      user: { id: result.lastInsertRowid, username, email },
      token,
    };
  }

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   * @param {string} credentials.email - 邮箱
   * @param {string} credentials.password - 密码
   * @returns {Object} 包含用户信息和 token 的对象
   */
  login(credentials) {
    const { email, password } = credentials;

    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    const user = userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return {
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
      },
    };
  }

  /**
   * 获取当前用户信息
   * @param {number} userId - 用户ID
   * @returns {Object} 用户信息（包含文章数和评论数）
   */
  getCurrentUser(userId) {
    const user = userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const postCount = userRepository.getPostCount(userId);
    const commentCount = userRepository.getCommentCount(userId);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      created_at: user.created_at,
      postCount: postCount.count,
      commentCount: commentCount.count,
    };
  }

  /**
   * 更新当前用户信息
   * @param {number} userId - 用户ID
   * @param {Object} userData - 用户数据
   * @returns {Object} 更新后的用户信息
   */
  updateCurrentUser(userId, userData) {
    const { username, email, bio, password } = userData;

    const currentUser = userRepository.findById(userId);
    if (!currentUser) {
      throw new NotFoundError("User not found");
    }

    const newUsername = username || currentUser.username;
    const newEmail = email || currentUser.email;
    const newBio = bio !== undefined ? bio : currentUser.bio;

    if (username && username !== currentUser.username) {
      const taken = userRepository.findByUsernameExcludeId(username, userId);
      if (taken) {
        throw new ConflictError("Username already taken");
      }
    }

    if (email && email !== currentUser.email) {
      const emailTaken = userRepository.findByEmailExcludeId(email, userId);
      if (emailTaken) {
        throw new ConflictError("Email already in use");
      }
    }

    if (password) {
      if (password.length < 6) {
        throw new BadRequestError("Password must be at least 6 characters");
      }
      const hashed = bcrypt.hashSync(password, 10);
      userRepository.update(userId, {
        username: newUsername,
        email: newEmail,
        bio: newBio,
        password: hashed,
      });
    } else {
      userRepository.update(userId, {
        username: newUsername,
        email: newEmail,
        bio: newBio,
      });
    }

    const updatedUser = userRepository.findById(userId);
    return {
      message: "Profile updated",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        created_at: updatedUser.created_at,
      },
    };
  }
}

module.exports = new UserService();
