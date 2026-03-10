<div align="center">

# 🛒 校园集市

**专为校园设计的二手交易平台**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat-square&logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[功能介绍](#-功能介绍) · [技术栈](#-技术栈) · [快速启动](#-快速启动) · [开发过程](#-开发过程)

</div>

---

## 📖 项目简介

**校园集市**是一个面向在校学生的二手商品交易平台，提供商品发布、搜索、交易、双向评价等完整闭环功能。支持手机号、微信、QQ 三种登录方式，采用 React + Django 前后端分离架构，图片资源托管于对象存储（OSS/COS），部署于 Debian 服务器。

---

## ✨ 功能介绍

### 用户体系

- **多方登录** — 手机号验证码 / 微信 OAuth / QQ OAuth
- **个人主页** — 头像、昵称、简介、在售商品、买卖家综合评分展示
- **关注系统** — 关注 / 取关其他用户，查看关注列表与粉丝列表

### 商品

- **发布商品** — 多图上传（OSS 直传）、分类、定价、新旧程度标注
- **商品搜索** — 关键词搜索 + 分类筛选 + 价格排序 + 无限滚动加载
- **个性化推送** — 基于浏览历史与分类偏好的推荐列表（Redis 缓存）
- **商品管理** — 在售 / 已售 / 下架状态自助管理

### 互动

- **评论** — 支持一级回复的楼层式评论区
- **点赞** — 商品点赞，乐观更新交互体验
- **通知** — 新关注、交易状态变更等系统消息

### 交易

- **交易流程** — 发起 → 卖家确认 → 交易中 → 完成 / 取消，全状态追踪
- **双向评分** — 交易完成后买卖双方互评（星级 + 文字），每笔交易限评一次

---

## 🏗️ 技术栈

| 层级            | 技术选型                                     |
| --------------- | -------------------------------------------- |
| **前端框架**    | React 18 + TypeScript + Vite                 |
| **状态管理**    | Zustand                                      |
| **UI 组件库**   | Arco Design                                  |
| **前端路由**    | React Router v6                              |
| **HTTP 客户端** | Axios（含 JWT 自动刷新拦截器）               |
| **后端框架**    | Django 4.2 + Django REST Framework           |
| **认证方案**    | SimpleJWT（Access + Refresh Token + 黑名单） |
| **数据库**      | PostgreSQL 15                                |
| **缓存 / 队列** | Redis 7                                      |
| **异步任务**    | Celery                                       |
| **对象存储**    | 阿里云 OSS / 腾讯云 COS（二选一）            |
| **Web 服务器**  | Gunicorn + Nginx                             |
| **容器化**      | Docker + Docker Compose                      |
| **部署环境**    | Debian 12                                    |
| **接口文档**    | drf-spectacular（Swagger UI / ReDoc）        |
| **测试**        | pytest-django + Locust                       |

---

## 📁 项目结构

```
campus-trade/
├── frontend/                        # React 前端
│   └── src/
│       ├── api/                     # Axios 封装（按模块拆分）
│       ├── components/              # 公共组件
│       ├── hooks/                   # 自定义 Hooks
│       ├── pages/                   # 页面组件
│       ├── store/                   # Zustand 全局状态
│       ├── router/                  # 路由配置 + 路由守卫
│       └── types/                   # TypeScript 类型定义
│
├── backend/                         # Django 后端
│   ├── config/                      # 项目配置（settings / urls / celery）
│   │   └── settings/
│   │       ├── base.py              # 公共配置
│   │       ├── development.py       # 开发配置
│   │       └── production.py        # 生产配置
│   ├── apps/
│   │   ├── users/                   # 用户：登录、注册、第三方 OAuth、关注
│   │   ├── products/                # 商品：CRUD、搜索、分类、推荐
│   │   ├── interactions/            # 互动：评论、点赞
│   │   ├── transactions/            # 交易：状态机、双向评分
│   │   └── notifications/           # 通知：信号触发、消息列表
│   ├── utils/                       # 工具：统一响应、分页、权限、OSS 封装
│   └── requirements/
│       ├── base.txt
│       ├── development.txt
│       └── production.txt
│
├── deploy/
│   ├── nginx/campus-trade.conf      # Nginx 反向代理配置
│   ├── docker/Dockerfile.backend    # 后端镜像
│   └── scripts/
│       ├── deploy.sh                # 一键部署脚本
│       └── backup.sh                # 数据库定时备份脚本
│
├── docker-compose.yml               # 生产环境服务编排
├── docker-compose.dev.yml           # 开发环境（仅 db + redis）
├── .env.example                     # 环境变量模板
└── README.md
```

---

## 🚀 快速启动

### 环境要求

- Docker >= 24.0 & Docker Compose >= 2.20
- Node.js >= 18（本地前端开发时需要）
- Python >= 3.11（本地后端开发时需要）

### 方式一：Docker 一键启动（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/campus-trade.git
cd campus-trade

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入数据库密码、OSS 密钥、SMS/微信/QQ 等配置

# 3. 启动全部服务
docker compose up -d

# 4. 初始化数据库（首次运行）
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser

# 5. 测试指令
docker compose run --rm backend pytest -q

# 6. 访问
#   前端:  http://localhost
#   API:   http://localhost/api/
#   文档:  http://localhost/api/docs/
```

### 方式二：本地开发环境

**后端**

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements/development.txt

# 启动 PostgreSQL + Redis（通过 Docker）
docker compose -f ../docker-compose.dev.yml up -d

python manage.py migrate --settings=config.settings.development
python manage.py runserver --settings=config.settings.development
```

**前端**

进入前端目录后，复制环境变量模板文件：

```bash
cd frontend
npm install
cp .env.example .env.local    # 配置 VITE_API_BASE_URL=http://localhost:8000
npm run dev                    # 访问 http://localhost:5173
```

### 关键环境变量说明

```env
# Django
DJANGO_SECRET_KEY=your-50-char-random-secret
DJANGO_ALLOWED_HOSTS=your-domain.com,localhost

# 数据库
POSTGRES_DB=campus_trade
POSTGRES_USER=ct_user
POSTGRES_PASSWORD=strong-password-here

# 对象存储（阿里云 OSS）
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET_NAME=campus-trade-media
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com

# 对象存储（腾讯云 COS，与 OSS 二选一）
# COS_SECRET_ID=xxx
# COS_SECRET_KEY=xxx
# COS_BUCKET=campus-trade-media-1234567890
# COS_REGION=ap-guangzhou

# 短信服务（阿里云 SMS）
SMS_ACCESS_KEY_ID=your-sms-key
SMS_ACCESS_KEY_SECRET=your-sms-secret
SMS_SIGN_NAME=校园集市
SMS_TEMPLATE_CODE=SMS_000000000

# 第三方登录
WECHAT_APP_ID=your-wechat-appid
WECHAT_APP_SECRET=your-wechat-appsecret
QQ_APP_ID=your-qq-appid
QQ_APP_KEY=your-qq-appkey
```

完整字段与说明见 [`.env.example`](.env.example)。

---

## 🗄️ 核心数据模型

```
User ────────── ThirdPartyAccount（微信 / QQ 绑定）
  │
  ├── Product ── ProductImage（image_url 指向 OSS）
  │     └── Category
  │
  ├── Comment（支持一级回复）
  ├── Like（unique_together 保证幂等）
  ├── Follow
  ├── Transaction ── Rating（unique_together 保证每方只评一次）
  └── Notification
```

启动后访问 `http://localhost/api/docs/` 查看完整 Swagger 接口文档。

---

## 👨‍💻 开发过程

### 开发时间线（14 天）

| 阶段            | 时间      | 主要交付物                                                 |
| --------------- | --------- | ---------------------------------------------------------- |
| **设计 & 架构** | Day 1–2   | UI 原型（Figma）、数据库 ERD、API 规范文档、项目脚手架搭建 |
| **核心功能**    | Day 3–6   | 登录（手机号/微信/QQ）、商品 CRUD、OSS 上传、主页、搜索    |
| **完整功能**    | Day 7–10  | 点赞、评论、关注、交易状态机、双向评分、通知               |
| **测试 & 修复** | Day 11–12 | 接口单元测试、UI 走查、压测报告、Bug 修复                  |
| **部署 & 验收** | Day 13–14 | 生产环境部署、全流程回归、文档归档、打 Tag `v1.0.0`        |

### 分支策略

```
main        生产分支，只接受来自 develop 的 PR，打 Tag 发版
develop     集成分支，所有功能在此汇总联调
feature/*   功能分支，从 develop 切出，完成后 PR 回 develop
fix/*       Bug 修复分支
```

```bash
# 开始新功能
git checkout develop && git pull
git checkout -b feature/product-search

# 完成后推送，发起 PR 到 develop
# 至少 1 人 Review 通过后合并，合并后删除功能分支
```

### Commit 规范（Conventional Commits）

```
feat:      新功能
fix:       Bug 修复
docs:      文档变更
style:     代码格式（不影响逻辑）
refactor:  重构
test:      测试相关
chore:     构建 / 依赖 / 脚本杂项
```

示例：`feat: 商品搜索支持价格区间筛选`

### 运行测试

```bash
# 后端单元测试 + 覆盖率
cd backend
pytest --cov=apps --cov-report=html
open htmlcov/index.html

# 接口压测（商品列表）
locust -f tests/locustfile.py --headless -u 50 -r 5 --run-time 60s
```

### 日常协作规范

- 每日 15 分钟站会，同步进度与阻塞点
- 接口变更走 Git PR 流程，变更当日同步前端团队
- Bug 跟踪统一使用 GitHub Issues，标注优先级

---

## 🚢 生产部署（Debian 12）

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 2. 克隆并配置
git clone https://github.com/your-org/campus-trade.git
cd campus-trade
cp .env.example .env       # 填写生产环境配置

# 3. 一键部署
chmod +x deploy/scripts/deploy.sh
./deploy/scripts/deploy.sh

# 4. 配置每日自动备份（凌晨 3 点）
(crontab -l; echo "0 3 * * * /path/to/deploy/scripts/backup.sh") | crontab -
```

---

## 👥 团队

| 成员 | 角色                         |
| ---- | ---------------------------- |
| A1   | 前端开发                     |
| A2   | 前端 / UI 设计               |
| B1   | 后端开发 + 测试              |
| B2   | 后端 + 运维 + **项目负责人** |

---

## 📄 License

[MIT License](LICENSE) · © 2024 校园集市开发团队
