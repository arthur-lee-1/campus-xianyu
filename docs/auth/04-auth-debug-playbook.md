# Auth 联调排障手册

## 1. 前端报 404

- 检查 baseURL 是否含 `/api`
- 检查路由：`/api/auth/login/phone/` 末尾斜杠是否一致

## 2. 一直 401

- 看请求头是否带 `Authorization: Bearer xxx`
- 检查 access 是否过期
- 检查 refresh 接口返回是否被前端正确存储

## 3. 发送验证码总是“频繁”

- Redis 里存在 `sms:code:<phone>:lock`
- 等 60 秒或清缓存

## 4. 验证码一直错误

- 开发环境使用 `SMS_DEV_CODE`（默认 123456）
- 检查后端 settings 是否读取到 env

## 5. 跨域问题

- 检查后端 `CORS_ALLOW_ALL_ORIGINS=True`（开发）
- 检查前端端口与请求地址
