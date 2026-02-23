import os
import sys
from dotenv import load_dotenv

def main():
    load_dotenv()  # 自动读当前目录的 .env
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()