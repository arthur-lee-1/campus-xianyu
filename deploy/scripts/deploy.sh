#!/bin/bash
# deploy/scripts/deploy.sh — 一键部署脚本
set -e

echo "🚀 开始部署校园集市..."

# 检查 .env 是否存在
if [ ! -f .env ]; then
  echo "❌ 未找到 .env 文件，请先复制 .env.example 并填写配置"
  exit 1
fi

# 构建前端
echo "📦 构建前端..."
cd frontend
npm ci
npm run build
cd ..

# 拉取最新镜像 / 重新构建
echo "🐳 构建 Docker 镜像..."
docker compose build

# 启动服务
echo "▶️  启动服务..."
docker compose up -d

# 等待数据库就绪
echo "⏳ 等待数据库启动..."
sleep 5

# 执行数据库迁移
echo "🗄️  执行数据库迁移..."
docker compose exec backend python manage.py migrate --settings=config.settings.production

# 收集静态文件
docker compose exec backend python manage.py collectstatic --noinput --settings=config.settings.production

echo "✅ 部署完成！"
echo "   前端: http://$(grep DJANGO_ALLOWED_HOSTS .env | cut -d= -f2 | cut -d, -f1)"
echo "   API文档: http://$(grep DJANGO_ALLOWED_HOSTS .env | cut -d= -f2 | cut -d, -f1)/api/docs/"
