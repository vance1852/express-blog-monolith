const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const usersRepository = require("../repositories/users.repository");

const JWT_SECRET = "super-secret-blog-key-dont-tell-anyone-2024";

/**
 * 用户注册
 * @param {string} username - 用户名
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {{ message: string, user: { id: number, username: string, email: string }, token: string }} 注册结果
 * @throws {Error} 验证失败时抛出错误
 */
function register(username, email, password) {
  if (!username || !email || !password) {
    const error = new Error("All fields are required");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error("Password must be at least 6 characters");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = usersRepository.findByUsernameOrEmail(username, email);
  if (existingUser) {
    const error = new Error("Username or email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = usersRepository.create(username, email, hashedPassword);

  const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: "7d" });

  return {
    message: "User registered successfully",
    user: { id: userId, username, email },
    token,
  };
}

/**
 * 用户登录
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {{ message: string, token: string, user: { id: number, username: string, email: string, bio: string } }} 登录结果
 * @throws {Error} 验证失败时抛出错误
 */
function login(email, password) {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const user = usersRepository.findByEmail(email);
  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" }
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

module.exports = {
  register,
  login,
};
