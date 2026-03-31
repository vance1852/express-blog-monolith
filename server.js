const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const postsRoutes = require("./routes/posts.routes");
const usersRoutes = require("./routes/users.routes");
const commentsRoutes = require("./routes/comments.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/comments", commentsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Blog API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
