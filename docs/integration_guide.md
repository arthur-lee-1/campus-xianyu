# 校园集市 - 前后端联调指南

## 1. 自动生成 API 文档
- 后端启动后，访问 Swagger 交互式文档：`http://127.0.0.1:8000/api/docs/`
- Redoc 格式文档：`http://127.0.0.1:8000/api/redoc/`

## 2. 登录模块联调约定
- **接口防刷**：验证码请求有 60 秒防刷锁定，5分钟有效期。
- **开发环境验证码**：短信验证码被 Mock 拦截，开发阶段统一使用固定验证码 `123456`。
- **Token 机制**：
  - Access Token 有效期：60 分钟。请求头格式：`Authorization: Bearer <token>`
  - Refresh Token 有效期：7 天。
- **前端环境变量**：本地联调时，请确保 `.env.development` 中设置了 `VITE_API_BASE_URL=http://127.0.0.1:8000`。

## 3. 依赖服务
- **Redis**：必须在本地运行（默认端口 6379），用于验证码缓存和 Celery 消息队列。
- **PostgreSQL**：默认数据库配置为 `campus_trade`，用户 `ct_user`。