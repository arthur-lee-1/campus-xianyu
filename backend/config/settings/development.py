from .base import *

DEBUG = True

ALLOWED_HOSTS = ["*"]

CORS_ALLOW_ALL_ORIGINS = True

# 本地开发默认使用 SQLite + 内存缓存，避免强依赖 PostgreSQL/Redis。
# 如需切回 PostgreSQL/Redis：在 .env 里将 DEV_USE_SQLITE=0、DEV_USE_LOCAL_CACHE=0。
DEV_USE_SQLITE = os.environ.get("DEV_USE_SQLITE", "1") == "1"
DEV_USE_LOCAL_CACHE = os.environ.get("DEV_USE_LOCAL_CACHE", "1") == "1"

if DEV_USE_SQLITE:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

if DEV_USE_LOCAL_CACHE:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "campus-trade-dev-cache",
        }
    }

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# 开发阶段 mock 短信验证码，固定为此值（生产环境删除）
SMS_DEV_CODE = os.environ.get("SMS_DEV_CODE", "123456")
