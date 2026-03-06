# Auth 前后端联调步骤

## Phase 0：环境对齐

1. 后端启动：`python manage.py runserver 0.0.0.0:8000`
2. 前端 `.env.development` 配置：
   - `VITE_API_BASE_URL=http://localhost:8000`
3. 确认 CORS 已开启（后端 development 为全开）

## Phase 1：接口冒烟（先不经过页面）

使用 Postman 或 curl 依次调用：

1. `/api/auth/sms/`
2. `/api/auth/login/phone/`
3. 带 access 调 `/api/users/me/`

通过后再接页面，避免 UI 干扰定位问题。

## Phase 2：前端请求层统一

1. axios 实例设置 `baseURL` 和 timeout
2. 请求拦截器注入 `Authorization`
3. 响应拦截器按后端结构处理：
   - `code === 200` 走成功
   - `401` 自动尝试 refresh
4. refresh 失败则清 token 并跳转登录页

## Phase 3：登录页面流程

1. 输入手机号 -> 发送验证码
2. 输入验证码 -> 手机登录
3. 保存 `access`、`refresh`、`user`
4. 跳转首页并拉取 `/api/users/me/` 校验状态

## Phase 4：登出流程

1. 调 `/api/auth/logout/`（带 refresh）
2. 本地清理 token/user
3. 跳转登录页

## Phase 5：第三方登录（先 mock）

1. 微信/QQ 按钮点击后，先拿到 mock openid
2. 调 `/api/auth/login/social/`
3. 若后端返回“首次登录需绑定”，弹出手机号验证码绑定弹窗

## 联调完成标准

- 手机登录、自动注册、个人信息读取/更新、登出、刷新 token 均可用
- access 过期可自动续期
- 错误提示清晰（验证码错误、发送频繁、未登录）
