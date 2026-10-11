"""Prepare an explicitly configured persistent Django deployment."""
import os
import psycopg

from django.core.management import execute_from_command_line


def main():
    if not os.environ.get("DATABASE_URL"):
        raise RuntimeError("Connect a dedicated PostgreSQL database before deploying the API.")
    if not os.environ.get("DJANGO_SECRET_KEY"):
        raise RuntimeError("Configure DJANGO_SECRET_KEY in the deployment environment.")
    # Use a direct database connection for migrations, without changing runtime pooling.
    if os.environ.get("DATABASE_URL_UNPOOLED"):
        os.environ["DATABASE_URL"] = os.environ["DATABASE_URL_UNPOOLED"]
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    # Concurrent builds must not migrate the same database simultaneously.
    with psycopg.connect(os.environ["DATABASE_URL"], autocommit=True, connect_timeout=15) as guard:
        guard.execute("SELECT pg_advisory_lock(%s)", (73402661008,))
        execute_from_command_line(["manage.py", "check", "--deploy", "--fail-level", "WARNING"])
        execute_from_command_line(["manage.py", "migrate", "--noinput"])
        execute_from_command_line(["manage.py", "seed_catalog"])
        execute_from_command_line(["manage.py", "bootstrap_roles"])
        execute_from_command_line(["manage.py", "bootstrap_owner"])
        execute_from_command_line(["manage.py", "seed_policies"])



if __name__ == "__main__":
    main()
