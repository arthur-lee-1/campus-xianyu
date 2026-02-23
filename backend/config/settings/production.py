from .base import *

DEBUG = False

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")

CORS_ALLOWED_ORIGINS = [
    f"https://{host}" for host in ALLOWED_HOSTS if host
]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# ── 对象存储（生产环境启用，开发环境用本地文件系统即可）────────
# 阿里云 OSS（django-storages[oss2]）
DEFAULT_FILE_STORAGE = "storages.backends.alioss.OssStorage"

# 如果使用腾讯云 COS，注释上面一行，改用：
# DEFAULT_FILE_STORAGE = "storages.backends.cos.COSStorage"
