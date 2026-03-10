# Auth API 契约（users 模块）

Base URL: `http://localhost:8000`

后端接口

- POST /api/auth/sms/
- POST /api/auth/login/phone/
- POST /api/auth/login/social/
- POST /api/auth/token/refresh/
- POST /api/auth/logout/
- GET /api/users/me/
- PATCH /api/users/me/

统一响应结构：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```
