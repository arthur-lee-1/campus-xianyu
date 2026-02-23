#!/bin/bash
# deploy/scripts/backup.sh — 数据库自动备份（建议 cron 每天凌晨3点执行）
# 0 3 * * * /path/to/deploy/scripts/backup.sh

set -e

BACKUP_DIR="/var/backups/campus-trade"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="db_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "📦 开始备份数据库: $FILENAME"

# 从运行中的容器执行 pg_dump
docker compose exec -T db pg_dump \
  -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_DIR/$FILENAME"

# 保留最近 30 天的备份
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +30 -delete

echo "✅ 备份完成: $BACKUP_DIR/$FILENAME"
