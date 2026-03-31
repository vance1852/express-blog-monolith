const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

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

db.exec("DELETE FROM comments");
db.exec("DELETE FROM posts");
db.exec("DELETE FROM users");

console.log("Cleared existing data.");

const password = bcrypt.hashSync("password123", 10);

const insertUser = db.prepare(
  "INSERT INTO users (username, email, password, bio) VALUES (?, ?, ?, ?)",
);

const users = [
  {
    username: "alice",
    email: "alice@example.com",
    bio: "Full-stack developer who loves writing about JavaScript and Node.js.",
  },
  {
    username: "bob",
    email: "bob@example.com",
    bio: "Backend engineer. Passionate about databases and system design.",
  },
  {
    username: "charlie",
    email: "charlie@example.com",
    bio: "Junior dev learning something new every day. Blogging my journey.",
  },
];

const userIds = [];
for (const u of users) {
  const result = insertUser.run(u.username, u.email, password, u.bio);
  userIds.push(result.lastInsertRowid);
  console.log(`Created user: ${u.username} (id: ${result.lastInsertRowid})`);
}

const insertPost = db.prepare(
  "INSERT INTO posts (title, content, author_id, status, created_at) VALUES (?, ?, ?, ?, ?)",
);

const posts = [
  {
    title: "Getting Started with Express.js",
    content:
      "Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. In this post, we will walk through setting up a basic Express server, defining routes, and handling middleware. Express makes it easy to build RESTful APIs and serves as the backbone of many Node.js applications in production today.",
    author_id: userIds[0],
    status: "published",
    created_at: "2024-01-15 10:00:00",
  },
  {
    title: "Understanding SQLite for Small Projects",
    content:
      "SQLite is a self-contained, serverless, zero-configuration database engine. It is the most widely deployed database in the world, found in phones, browsers, and embedded systems. For small to medium projects, SQLite offers incredible simplicity — no separate server process, no configuration, just a single file on disk. In this article, we explore when SQLite is the right choice and how to use it effectively with Node.js.",
    author_id: userIds[1],
    status: "published",
    created_at: "2024-02-01 14:30:00",
  },
  {
    title: "JWT Authentication Explained",
    content:
      "JSON Web Tokens (JWT) are a compact, URL-safe means of representing claims to be transferred between two parties. JWTs are commonly used for authentication in web applications. When a user logs in, the server generates a token that the client stores and sends with subsequent requests. This post covers how JWT works, its structure (header, payload, signature), and best practices for secure implementation.",
    author_id: userIds[0],
    status: "published",
    created_at: "2024-02-20 09:15:00",
  },
  {
    title: "My First Month Learning to Code",
    content:
      "One month ago, I decided to learn programming. I started with HTML and CSS, then moved to JavaScript. It has been a wild ride — some days I feel like I understand everything, other days nothing makes sense. But I keep going. The community has been incredibly supportive. Here are the resources that helped me the most and the mistakes I made along the way.",
    author_id: userIds[2],
    status: "published",
    created_at: "2024-03-05 16:45:00",
  },
  {
    title: "Database Design Patterns for REST APIs",
    content:
      "Designing a good database schema is crucial for building scalable REST APIs. In this post, we discuss normalization, indexing strategies, and common patterns like soft deletes, audit trails, and polymorphic associations. We also look at how to structure your queries for optimal performance and when to denormalize for read-heavy workloads. Good schema design saves you from painful migrations later.",
    author_id: userIds[1],
    status: "draft",
    created_at: "2024-03-18 11:00:00",
  },
];

const postIds = [];
for (const p of posts) {
  const result = insertPost.run(
    p.title,
    p.content,
    p.author_id,
    p.status,
    p.created_at,
  );
  postIds.push(result.lastInsertRowid);
  console.log(`Created post: "${p.title}" (id: ${result.lastInsertRowid})`);
}

const insertComment = db.prepare(
  "INSERT INTO comments (content, post_id, author_id, created_at) VALUES (?, ?, ?, ?)",
);

const comments = [
  {
    content: "Great introduction! Express is my go-to framework.",
    post_id: postIds[0],
    author_id: userIds[1],
    created_at: "2024-01-16 08:00:00",
  },
  {
    content: "Could you write a follow-up about middleware patterns?",
    post_id: postIds[0],
    author_id: userIds[2],
    created_at: "2024-01-17 12:30:00",
  },
  {
    content:
      "I switched from PostgreSQL to SQLite for my side project and never looked back.",
    post_id: postIds[1],
    author_id: userIds[0],
    created_at: "2024-02-02 10:00:00",
  },
  {
    content: "What about concurrent writes? Is SQLite good enough for that?",
    post_id: postIds[1],
    author_id: userIds[2],
    created_at: "2024-02-03 15:20:00",
  },
  {
    content:
      "WAL mode helps a lot with concurrent reads. Writes are still serialized though.",
    post_id: postIds[1],
    author_id: userIds[1],
    created_at: "2024-02-04 09:45:00",
  },
  {
    content:
      "This is exactly what I needed. JWT was confusing until I read this.",
    post_id: postIds[2],
    author_id: userIds[1],
    created_at: "2024-02-21 11:00:00",
  },
  {
    content: "You should mention refresh tokens too!",
    post_id: postIds[2],
    author_id: userIds[2],
    created_at: "2024-02-22 14:10:00",
  },
  {
    content: "Keep going Charlie! The first month is the hardest.",
    post_id: postIds[3],
    author_id: userIds[0],
    created_at: "2024-03-06 08:30:00",
  },
  {
    content: "I remember my first month. It gets so much better!",
    post_id: postIds[3],
    author_id: userIds[1],
    created_at: "2024-03-06 19:00:00",
  },
  {
    content: "Thanks for sharing your journey. Very relatable.",
    post_id: postIds[3],
    author_id: userIds[0],
    created_at: "2024-03-07 10:15:00",
  },
];

for (const c of comments) {
  const result = insertComment.run(
    c.content,
    c.post_id,
    c.author_id,
    c.created_at,
  );
  console.log(
    `Created comment (id: ${result.lastInsertRowid}) on post ${c.post_id}`,
  );
}

db.close();

console.log("\nSeed data created successfully!");
console.log(`  Users: ${users.length} (password for all: "password123")`);
console.log(`  Posts: ${posts.length}`);
console.log(`  Comments: ${comments.length}`);
