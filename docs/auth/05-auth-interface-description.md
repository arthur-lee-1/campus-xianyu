# 登录模块接口说明

## 1. 文档目的

本文档用于说明校园二手交易平台“用户登录模块”的后端接口，供前端联调、后续模块开发及测试使用。

当前登录模块以“手机号 + 短信验证码登录”为主，配套提供获取当前用户、刷新令牌、退出登录等接口。

---

## 2. 基础信息

### 2.1 开发环境基础地址

```txt
http://localhost:8000
```

完整接口地址 = `基础地址 + 接口路径`

例如：

```txt
http://localhost:8000/api/auth/login/phone/
```

### 2.2 在线接口文档

Swagger：

```txt
http://localhost:8000/api/docs/
```

ReDoc：

```txt
http://localhost:8000/api/redoc/
```

---

## 3. 统一约定

### 3.1 请求头

普通 JSON 请求：

```http
Content-Type: application/json
```

需要登录鉴权的接口，还需要携带：

```http
Authorization: Bearer <access_token>
```

### 3.2 普通接口返回格式

除特殊说明外，接口统一返回格式如下：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

字段说明：

- `code`：业务状态码
- `message`：业务提示信息
- `data`：返回数据主体

### 3.3 鉴权说明

登录成功后，后端会返回两个令牌：

- `access`：访问令牌，用于访问受保护接口
- `refresh`：刷新令牌，用于换取新的 `access`

前端请求受保护接口时，需要在请求头中携带：

```http
Authorization: Bearer <access_token>
```

### 3.4 特殊说明

`/api/auth/token/refresh/` 为 JWT 刷新接口，成功返回格式不是统一包裹结构，而是 JWT 默认格式：

```json
{
  "access": "new_access_token",
  "refresh": "new_refresh_token"
}
```

---

## 4. 接口列表

### 4.1 发送短信验证码

#### 接口信息

- 请求方式：`POST`
- 接口路径：`/api/auth/sms/`
- 完整地址：`http://localhost:8000/api/auth/sms/`
- 是否需要登录：否

#### 请求参数

```json
{
  "phone": "13800138000"
}
```

#### 参数说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| phone | string | 是 | 中国大陆手机号 |

#### 成功返回

```json
{
  "code": 200,
  "message": "验证码已发送",
  "data": null
}
```

#### 失败示例

```json
{
  "code": 400,
  "message": "发送太频繁，请稍后再试",
  "data": null
}
```

#### 说明

- 开发环境验证码固定为：

```txt
123456
```

- 验证码有效期：5 分钟
- 同一手机号发送锁定时间：60 秒

---

### 4.2 手机号验证码登录

#### 接口信息

- 请求方式：`POST`
- 接口路径：`/api/auth/login/phone/`
- 完整地址：`http://localhost:8000/api/auth/login/phone/`
- 是否需要登录：否

#### 请求参数

```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

#### 参数说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| phone | string | 是 | 手机号 |
| code | string | 是 | 短信验证码 |

#### 成功返回

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "access": "eyJ...",
    "refresh": "eyJ...",
    "is_new": true,
    "user": {
      "id": 1,
      "phone": "13800138000",
      "nickname": "用户8000",
      "avatar": null,
      "bio": "",
      "school": "",
      "date_joined": "2026-03-10T01:23:45.000000+08:00"
    }
  }
}
```

#### 返回字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| access | string | 访问令牌 |
| refresh | string | 刷新令牌 |
| is_new | boolean | 是否为首次登录自动注册 |
| user | object | 当前登录用户信息 |

#### user 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| id | number | 用户 ID |
| phone | string | 手机号 |
| nickname | string | 昵称 |
| avatar | string \| null | 头像地址 |
| bio | string | 个人简介 |
| school | string | 学校 |
| date_joined | string | 注册时间 |

#### 失败示例

```json
{
  "code": 400,
  "message": "验证码错误或已过期",
  "data": null
}
```

#### 说明

- 若手机号对应用户不存在，系统会自动创建用户并登录
- 前端登录成功后，应保存 `access` 与 `refresh`
- 后续访问受保护接口时，使用 `access`

---

### 4.3 刷新 access token

#### 接口信息

- 请求方式：`POST`
- 接口路径：`/api/auth/token/refresh/`
- 完整地址：`http://localhost:8000/api/auth/token/refresh/`
- 是否需要登录：否

#### 请求参数

```json
{
  "refresh": "旧的refresh_token"
}
```

#### 参数说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| refresh | string | 是 | 刷新令牌 |

#### 成功返回

```json
{
  "access": "新的access_token",
  "refresh": "新的refresh_token"
}
```

#### 说明

- 本项目启用了 refresh token 轮换机制
- 刷新成功后，通常会返回新的 `access` 和新的 `refresh`
- 旧的 `refresh` 后续会失效
- 当前端请求受保护接口返回 `401` 时，应尝试调用本接口刷新令牌，再重试原请求

#### 失败场景

- refresh 已过期
- refresh 已被拉黑
- refresh 非法或格式错误

通常返回 `401 Unauthorized`

---

### 4.4 获取当前登录用户信息

#### 接口信息

- 请求方式：`GET`
- 接口路径：`/api/users/me/`
- 完整地址：`http://localhost:8000/api/users/me/`
- 是否需要登录：是

#### 请求头

```http
Authorization: Bearer <access_token>
```

#### 请求参数

无

#### 成功返回

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "phone": "13800138000",
    "nickname": "用户8000",
    "avatar": null,
    "bio": "",
    "school": "",
    "date_joined": "2026-03-10T01:23:45.000000+08:00"
  }
}
```

#### 用途

本接口通常用于以下场景：

- 登录成功后拉取当前用户信息
- 刷新页面后恢复登录态
- 校验当前 `access_token` 是否有效
- 作为前端路由守卫或初始化登录状态的依据

---

### 4.5 退出登录

#### 接口信息

- 请求方式：`POST`
- 接口路径：`/api/auth/logout/`
- 完整地址：`http://localhost:8000/api/auth/logout/`
- 是否需要登录：是

#### 请求头

```http
Authorization: Bearer <access_token>
```

#### 请求参数

```json
{
  "refresh": "当前refresh_token"
}
```

#### 参数说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| refresh | string | 是 | 当前刷新令牌 |

#### 成功返回

```json
{
  "code": 200,
  "message": "已退出登录",
  "data": null
}
```

#### 说明

- 该接口不仅仅是前端清空本地 token
- 后端会将当前 `refresh_token` 拉黑
- 退出登录后，原 refresh 不应再用于换取新 access

---

## 5. 可选接口

以下接口不是“手机号登录闭环”的必需部分，但当前项目中已经存在。

### 5.1 第三方登录（微信 / QQ）

#### 接口信息

- 请求方式：`POST`
- 接口路径：`/api/auth/login/social/`
- 完整地址：`http://localhost:8000/api/auth/login/social/`
- 是否需要登录：否

#### 已绑定账号时请求示例

```json
{
  "platform": "wechat",
  "openid": "wx_openid_001"
}
```

#### 首次绑定时请求示例

```json
{
  "platform": "wechat",
  "openid": "wx_openid_001",
  "union_id": "",
  "phone": "13800138000",
  "code": "123456"
}
```

#### 成功返回

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "access": "eyJ...",
    "refresh": "eyJ...",
    "is_new": false,
    "user": {
      "id": 1,
      "phone": "13800138000",
      "nickname": "用户8000",
      "avatar": null,
      "bio": "",
      "school": "",
      "date_joined": "2026-03-10T01:23:45.000000+08:00"
    }
  }
}
```

#### 参数说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| platform | string | 是 | 第三方平台，如 `wechat`、`qq` |
| openid | string | 是 | 第三方平台用户唯一标识 |
| union_id | string | 否 | 第三方平台联合标识 |
| phone | string | 否 | 首次绑定时需要 |
| code | string | 否 | 首次绑定时需要的短信验证码 |

---

## 6. 登录联调建议流程

建议前后端联调按以下顺序进行：

### 6.1 登录流程

1. 调用 `/api/auth/sms/` 发送验证码
2. 使用固定验证码 `123456` 调用 `/api/auth/login/phone/`
3. 保存返回的 `access` 和 `refresh`
4. 调用 `/api/users/me/` 验证登录态是否生效

### 6.2 刷新令牌流程

1. 人为让 `access_token` 失效，或等待其过期
2. 访问受保护接口，如 `/api/users/me/`
3. 收到 `401` 后，调用 `/api/auth/token/refresh/`
4. 使用新的 `access` 重试原请求
5. 请求成功则说明刷新逻辑正常

### 6.3 退出登录流程

1. 调用 `/api/auth/logout/`
2. 前端清空本地 `access` 与 `refresh`
3. 再次调用 `/api/auth/token/refresh/`
4. 若刷新失败，说明退出登录逻辑正常

---

## 7. 前端对接建议

### 7.1 Token 存储建议

前端至少应保存：

- `access_token`
- `refresh_token`
- 当前用户信息 `user`

### 7.2 请求拦截建议

建议前端请求层统一处理：

- 自动在请求头中注入 `Authorization: Bearer <access_token>`
- 受保护接口返回 `401` 时自动尝试刷新 token
- 刷新成功后重试原请求
- 刷新失败则清空本地登录态并跳转登录页

### 7.3 启动时登录态恢复建议

应用初始化时：

1. 若本地存在 `access_token`
2. 主动调用 `/api/users/me/`
3. 若成功，恢复用户会话
4. 若失败，再尝试刷新 token 或清空会话

---

## 8. 测试用例建议

### 8.1 正常登录

- 输入合法手机号
- 输入验证码 `123456`
- 应成功登录并获取 token

### 8.2 错误验证码

- 输入错误验证码
- 应返回业务错误提示

### 8.3 access 过期自动刷新

- 使用过期 access 请求 `/api/users/me/`
- 前端应自动调用刷新接口
- 刷新成功后自动重试原请求

### 8.4 退出登录后 refresh 失效

- 先正常登录
- 调用退出登录接口
- 再用原 refresh 调用刷新接口
- 应刷新失败

---

## 9. 当前登录模块核心接口汇总

| 功能 | 方法 | 路径 | 是否需要登录 |
|---|---|---|---|
| 发送短信验证码 | POST | `/api/auth/sms/` | 否 |
| 手机号验证码登录 | POST | `/api/auth/login/phone/` | 否 |
| 刷新 token | POST | `/api/auth/token/refresh/` | 否 |
| 获取当前用户信息 | GET | `/api/users/me/` | 是 |
| 退出登录 | POST | `/api/auth/logout/` | 是 |

---

## 10. 备注

- 开发环境短信验证码固定为：`123456`
- 普通业务接口返回格式为：`{ code, message, data }`
- 刷新 token 接口成功返回格式为：`{ access, refresh }`
- 若后续接口字段或地址调整，请同步更新本文档