from .base import *

DEBUG = True

ALLOWED_HOSTS = ["*"]

CORS_ALLOW_ALL_ORIGINS = True

# 开发阶段用本地文件系统代替 OSS，无需配置密钥
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# 开发阶段 mock 短信验证码，固定为此值（生产环境删除）
SMS_DEV_CODE = os.environ.get("SMS_DEV_CODE", "123456")
