# Express 博客 API

一个使用 Express + SQLite 构建的单体博客 REST API。所有后端逻辑都在一个 `server.js` 文件中。

## 快速开始

```bash
# 安装依赖
npm install

# 初始化示例数据
npm run seed

# 启动服务器
npm start

# 或使用 nodemon 开发模式
npm run dev
```

服务器默认运行在 `http://localhost:3000`。

## 测试账号

初始化数据后，可以使用以下账号登录（密码统一为 `password123`）：

| 用户名  | 邮箱                |
| ------- | ------------------- |
| alice   | alice@example.com   |
| bob     | bob@example.com     |
| charlie | charlie@example.com |

## API 接口

### 认证

| 方法 | 路径                 | 说明               | 需要认证 |
| ---- | -------------------- | ------------------ | -------- |
| POST | `/api/auth/register` | 注册新用户         | 否       |
| POST | `/api/auth/login`    | 用户登录，返回 JWT | 否       |

### 用户

| 方法 | 路径            | 说明             | 需要认证 |
| ---- | --------------- | ---------------- | -------- |
| GET  | `/api/users/me` | 获取当前用户信息 | 是       |
| PUT  | `/api/users/me` | 更新当前用户信息 | 是       |

### 文章

| 方法   | 路径             | 说明                               | 需要认证 |
| ------ | ---------------- | ---------------------------------- | -------- |
| GET    | `/api/posts`     | 获取文章列表（支持分页和作者筛选） | 否       |
| GET    | `/api/posts/:id` | 获取单篇文章（含评论）             | 否       |
| POST   | `/api/posts`     | 创建文章                           | 是       |
| PUT    | `/api/posts/:id` | 更新文章（仅作者）                 | 是       |
| DELETE | `/api/posts/:id` | 删除文章（仅作者）                 | 是       |

### 评论

| 方法   | 路径                      | 说明               | 需要认证 |
| ------ | ------------------------- | ------------------ | -------- |
| GET    | `/api/posts/:id/comments` | 获取文章评论列表   | 否       |
| POST   | `/api/posts/:id/comments` | 添加评论           | 是       |
| DELETE | `/api/comments/:id`       | 删除评论（仅作者） | 是       |

### 其他

| 方法 | 路径          | 说明     |
| ---- | ------------- | -------- |
| GET  | `/api/health` | 健康检查 |

## 请求示例

```bash
# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "password123"}'

# 获取文章列表
curl http://localhost:3000/api/posts

# 创建文章（需要 token）
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"title": "新文章", "content": "文章内容..."}'
```

## 技术栈

- Express.js - Web 框架
- better-sqlite3 - SQLite 数据库
- bcryptjs - 密码加密
- jsonwebtoken - JWT 认证
- cors - 跨域支持
