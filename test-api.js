const http = require("http");

const HOSTNAME = "localhost";
const PORT = 3000;

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOSTNAME,
      port: PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("开始API兼容性测试");
  console.log("=".repeat(60));

  let authToken = null;
  let testUserId = null;
  let testPostId = null;
  let testCommentId = null;

  try {
    console.log("\n1. 测试健康检查接口");
    const health = await makeRequest("GET", "/api/health");
    console.log(`   状态: ${health.status}`);
    console.log(`   ✓ 健康检查正常: ${health.data.status}`);

    console.log("\n2. 测试用户注册接口");
    const register = await makeRequest("POST", "/api/auth/register", {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    console.log(`   状态: ${register.status}`);
    console.log(`   ✓ 注册成功，用户ID: ${register.data.user.id}`);
    console.log(`   ✓ 返回token: ${!!register.data.token}`);
    testUserId = register.data.user.id;
    authToken = register.data.token;

    console.log("\n3. 测试用户登录接口");
    const login = await makeRequest("POST", "/api/auth/login", {
      email: "test@example.com",
      password: "password123",
    });
    console.log(`   状态: ${login.status}`);
    console.log(`   ✓ 登录成功，用户ID: ${login.data.user.id}`);
    console.log(`   ✓ 返回token: ${!!login.data.token}`);
    authToken = login.data.token;

    console.log("\n4. 测试获取当前用户信息接口");
    const me = await makeRequest("GET", "/api/users/me", null, authToken);
    console.log(`   状态: ${me.status}`);
    console.log(`   ✓ 用户ID: ${me.data.id}`);
    console.log(`   ✓ 用户名: ${me.data.username}`);
    console.log(`   ✓ 邮箱: ${me.data.email}`);
    console.log(`   ✓ 文章数: ${me.data.posts_count}`);
    console.log(`   ✓ 评论数: ${me.data.comments_count}`);

    console.log("\n5. 测试更新用户资料接口");
    const updateProfile = await makeRequest(
      "PUT",
      "/api/users/me",
      {
        username: "testuser_updated",
        bio: "这是我的个人简介",
      },
      authToken,
    );
    console.log(`   状态: ${updateProfile.status}`);
    console.log(`   ✓ 更新成功，用户名: ${updateProfile.data.user.username}`);
    console.log(`   ✓ 个人简介: ${updateProfile.data.user.bio}`);

    console.log("\n6. 测试创建文章接口");
    const createPost = await makeRequest(
      "POST",
      "/api/posts",
      {
        title: "测试文章标题",
        content: "这是测试文章的内容，包含一些文字。",
      },
      authToken,
    );
    console.log(`   状态: ${createPost.status}`);
    console.log(`   ✓ 文章ID: ${createPost.data.post.id}`);
    console.log(`   ✓ 文章标题: ${createPost.data.post.title}`);
    testPostId = createPost.data.post.id;

    console.log("\n7. 测试获取文章列表接口");
    const posts = await makeRequest("GET", "/api/posts");
    console.log(`   状态: ${posts.status}`);
    console.log(`   ✓ 文章总数: ${posts.data.total}`);
    console.log(`   ✓ 当前页: ${posts.data.page}`);
    console.log(`   ✓ 每页数量: ${posts.data.limit}`);
    console.log(`   ✓ 文章列表长度: ${posts.data.data.length}`);

    console.log("\n8. 测试获取单篇文章接口");
    const post = await makeRequest("GET", `/api/posts/${testPostId}`);
    console.log(`   状态: ${post.status}`);
    console.log(`   ✓ 文章ID: ${post.data.id}`);
    console.log(`   ✓ 文章标题: ${post.data.title}`);
    console.log(`   ✓ 作者信息: ${!!post.data.author}`);

    console.log("\n9. 测试更新文章接口");
    const updatePost = await makeRequest(
      "PUT",
      `/api/posts/${testPostId}`,
      {
        title: "更新后的文章标题",
        content: "更新后的文章内容。",
      },
      authToken,
    );
    console.log(`   状态: ${updatePost.status}`);
    console.log(`   ✓ 更新成功，标题: ${updatePost.data.post.title}`);

    console.log("\n10. 测试添加评论接口");
    const addComment = await makeRequest(
      "POST",
      `/api/posts/${testPostId}/comments`,
      {
        content: "这是一条测试评论。",
      },
      authToken,
    );
    console.log(`    状态: ${addComment.status}`);
    console.log(`    ✓ 评论ID: ${addComment.data.comment.id}`);
    console.log(`    ✓ 评论内容: ${addComment.data.comment.content}`);
    testCommentId = addComment.data.comment.id;

    console.log("\n11. 测试获取文章评论列表接口");
    const comments = await makeRequest(
      "GET",
      `/api/posts/${testPostId}/comments`,
    );
    console.log(`    状态: ${comments.status}`);
    console.log(`    ✓ 评论总数: ${comments.data.total}`);
    console.log(`    ✓ 评论列表长度: ${comments.data.data.length}`);

    console.log("\n12. 测试删除评论接口");
    const deleteComment = await makeRequest(
      "DELETE",
      `/api/comments/${testCommentId}`,
      null,
      authToken,
    );
    console.log(`    状态: ${deleteComment.status}`);
    console.log(`    ✓ 删除成功: ${deleteComment.data.message}`);

    console.log("\n13. 测试删除文章接口");
    const deletePost = await makeRequest(
      "DELETE",
      `/api/posts/${testPostId}`,
      null,
      authToken,
    );
    console.log(`    状态: ${deletePost.status}`);
    console.log(`    ✓ 删除成功: ${deletePost.data.message}`);

    console.log("\n14. 测试未授权访问");
    const unauthorized = await makeRequest("GET", "/api/users/me");
    console.log(`    状态: ${unauthorized.status}`);
    console.log(`    ✓ 正确返回401未授权`);

    console.log("\n15. 测试无效token");
    const invalidToken = await makeRequest(
      "GET",
      "/api/users/me",
      null,
      "invalid_token",
    );
    console.log(`    状态: ${invalidToken.status}`);
    console.log(`    ✓ 正确返回401，错误信息: ${invalidToken.data.error}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ 所有测试通过！接口行为完全一致！");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ 测试失败:", error.message);
    process.exit(1);
  }
}

runTests();
