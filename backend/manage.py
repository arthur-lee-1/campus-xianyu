import os
import sys
from pathlib import Path
from dotenv import load_dotenv


def main():
    backend_dir = Path(__file__).resolve().parent
    repo_root = backend_dir.parent

    # 优先读取仓库根目录 .env，其次兼容 backend/.env
    load_dotenv(repo_root / ".env")
    load_dotenv(backend_dir / ".env")

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()