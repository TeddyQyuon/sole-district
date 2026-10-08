"""Prepare an explicitly configured persistent Django deployment."""
import os

from django.core.management import execute_from_command_line


def main():
    if not os.environ.get("DATABASE_URL"):
        raise RuntimeError("Connect a dedicated PostgreSQL database before deploying the API.")
    if not os.environ.get("DJANGO_SECRET_KEY"):
        raise RuntimeError("Configure DJANGO_SECRET_KEY in the deployment environment.")
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    execute_from_command_line(["manage.py", "check", "--deploy"])
    execute_from_command_line(["manage.py", "migrate", "--noinput"])
    execute_from_command_line(["manage.py", "seed_catalog"])
    execute_from_command_line(["manage.py", "bootstrap_roles"])


if __name__ == "__main__":
    main()
