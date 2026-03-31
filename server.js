const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "super-secret-blog-key-dont-tell-anyone-2024";

const db = new Database(path.join(__dirname, "blog.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    bio TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    post_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id)
  )
`);

app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  const existing_user = db
    .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .get(username, email);
  if (existing_user) {
    return res.status(409).json({ error: "Username or email already exists" });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db
      .prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)")
      .run(username, email, hashedPassword);

    const token = jwt.sign(
      { userId: result.lastInsertRowid, username: username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "User registered successfully",
      user: { id: result.lastInsertRowid, username, email },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
    },
  });
});

app.get("/api/posts", (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const author_id = req.query.author_id;

    let query;
    let countQuery;
    let posts;
    let totalResult;

    if (author_id) {
      query =
        `SELECT posts.*, users.username as author_name 
               FROM posts 
               JOIN users ON posts.author_id = users.id 
               WHERE posts.author_id = ` +
        author_id +
        ` 
               ORDER BY posts.created_at DESC 
               LIMIT ${limit} OFFSET ${offset}`;
      countQuery =
        "SELECT COUNT(*) as total FROM posts WHERE author_id = " + author_id;
      posts = db.prepare(query).all();
      totalResult = db.prepare(countQuery).get();
    } else {
      posts = db
        .prepare(
          `SELECT posts.*, users.username as author_name 
                          FROM posts 
                          JOIN users ON posts.author_id = users.id 
                          ORDER BY posts.created_at DESC 
                          LIMIT ? OFFSET ?`,
        )
        .all(limit, offset);
      totalResult = db.prepare("SELECT COUNT(*) as total FROM posts").get();
    }

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch posts", details: err.message });
  }
});

app.get("/api/posts/:id", (req, res) => {
  const postId = req.params.id;

  const post = db
    .prepare(
      `SELECT posts.*, users.username as author_name 
                           FROM posts 
                           JOIN users ON posts.author_id = users.id 
                           WHERE posts.id = ?`,
    )
    .get(postId);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const comments = db
    .prepare(
      `SELECT comments.*, users.username as author_name 
                               FROM comments 
                               JOIN users ON comments.author_id = users.id 
                               WHERE comments.post_id = ? 
                               ORDER BY comments.created_at ASC`,
    )
    .all(postId);

  res.json({ ...post, comments });
});

app.post("/api/posts", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const { title, content, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const postStatus = status || "published";
    const result = db
      .prepare(
        "INSERT INTO posts (title, content, author_id, status) VALUES (?, ?, ?, ?)",
      )
      .run(title, content, userId, postStatus);

    const newPost = db
      .prepare(
        "SELECT posts.*, users.username as author_name FROM posts JOIN users ON posts.author_id = users.id WHERE posts.id = ?",
      )
      .get(result.lastInsertRowid);

    res.status(201).json(newPost);
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Failed to create post" });
  }
});

app.put("/api/posts/:id", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const postId = req.params.id;
  const existing = db.prepare("SELECT * FROM posts WHERE id = ?").get(postId);

  if (!existing) {
    return res.status(404).json({ msg: "Post not found" });
  }

  if (existing.author_id !== decoded.userId) {
    return res.status(403).json({ msg: "You can only edit your own posts" });
  }

  const { title, content, status } = req.body;
  const updatedTitle = title || existing.title;
  const updatedContent = content || existing.content;
  const updated_status = status || existing.status;

  db.prepare(
    `UPDATE posts SET title = ?, content = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  ).run(updatedTitle, updatedContent, updated_status, postId);

  const updatedPost = db
    .prepare(
      "SELECT posts.*, users.username as author_name FROM posts JOIN users ON posts.author_id = users.id WHERE posts.id = ?",
    )
    .get(postId);

  res.json(updatedPost);
});

app.delete("/api/posts/:id", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.replace("Bearer ", "");
  let userData;
  try {
    userData = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: "Bad token" });
  }

  const post_id = req.params.id;
  const thePost = db.prepare("SELECT * FROM posts WHERE id = " + post_id).get();

  if (!thePost) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (thePost.author_id !== userData.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  db.prepare("DELETE FROM posts WHERE id = ?").run(post_id);
  res.json({ message: "Post deleted successfully" });
});

app.get("/api/users/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = db
      .prepare(
        "SELECT id, username, email, bio, created_at FROM users WHERE id = ?",
      )
      .get(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const postCount = db
      .prepare("SELECT COUNT(*) as count FROM posts WHERE author_id = ?")
      .get(decoded.userId);
    const commentCount = db
      .prepare("SELECT COUNT(*) as count FROM comments WHERE author_id = ?")
      .get(decoded.userId);

    res.json({
      ...user,
      postCount: postCount.count,
      commentCount: commentCount.count,
    });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.put("/api/users/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  let decoded;
  try {
    const token = authHeader.split(" ")[1];
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { username, email, bio, password } = req.body;

  const currentUser = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(decoded.userId);
  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const new_username = username || currentUser.username;
  const new_email = email || currentUser.email;
  const newBio = bio !== undefined ? bio : currentUser.bio;

  if (username && username !== currentUser.username) {
    const taken = db
      .prepare("SELECT id FROM users WHERE username = ? AND id != ?")
      .get(username, decoded.userId);
    if (taken) {
      return res.status(409).json({ error: "Username already taken" });
    }
  }

  if (email && email !== currentUser.email) {
    const emailTaken = db
      .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
      .get(email, decoded.userId);
    if (emailTaken) {
      return res.status(409).json({ error: "Email already in use" });
    }
  }

  if (password) {
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }
    const hashed = bcrypt.hashSync(password, 10);
    db.prepare(
      "UPDATE users SET username = ?, email = ?, bio = ?, password = ? WHERE id = ?",
    ).run(new_username, new_email, newBio, hashed, decoded.userId);
  } else {
    db.prepare(
      "UPDATE users SET username = ?, email = ?, bio = ? WHERE id = ?",
    ).run(new_username, new_email, newBio, decoded.userId);
  }

  const updatedUser = db
    .prepare(
      "SELECT id, username, email, bio, created_at FROM users WHERE id = ?",
    )
    .get(decoded.userId);
  res.json({ message: "Profile updated", user: updatedUser });
});

app.get("/api/posts/:id/comments", (req, res) => {
  const post_id = req.params.id;

  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(post_id);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const comments = db
    .prepare(
      `SELECT comments.*, users.username as author_name 
     FROM comments 
     JOIN users ON comments.author_id = users.id 
     WHERE comments.post_id = ? 
     ORDER BY comments.created_at ASC 
     LIMIT ? OFFSET ?`,
    )
    .all(post_id, limit, offset);

  const total_result = db
    .prepare("SELECT COUNT(*) as total FROM comments WHERE post_id = ?")
    .get(post_id);

  res.json({
    comments,
    pagination: {
      page,
      limit,
      total: total_result.total,
      totalPages: Math.ceil(total_result.total / limit),
    },
  });
});

app.post("/api/posts/:id/comments", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "You must be logged in to comment" });
  }

  let user_data;
  try {
    const token = authHeader.replace("Bearer ", "");
    user_data = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const postId = req.params.id;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Comment content is required" });
  }

  if (content.length > 1000) {
    return res
      .status(400)
      .json({ message: "Comment is too long (max 1000 characters)" });
  }

  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  try {
    const result = db
      .prepare(
        "INSERT INTO comments (content, post_id, author_id) VALUES (?, ?, ?)",
      )
      .run(content, postId, user_data.userId);

    const newComment = db
      .prepare(
        `SELECT comments.*, users.username as author_name 
       FROM comments 
       JOIN users ON comments.author_id = users.id 
       WHERE comments.id = ?`,
      )
      .get(result.lastInsertRowid);

    res.status(201).json(newComment);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add comment", error: error.message });
  }
});

app.delete("/api/comments/:id", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const commentId = req.params.id;
  const comment = db
    .prepare("SELECT * FROM comments WHERE id = ?")
    .get(commentId);

  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }

  if (comment.author_id !== decoded.userId) {
    return res
      .status(403)
      .json({ error: "You can only delete your own comments" });
  }

  db.prepare("DELETE FROM comments WHERE id = ?").run(commentId);
  res.json({ message: "Comment deleted" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Blog API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
