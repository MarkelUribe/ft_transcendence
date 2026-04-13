#!/bin/sh
set -eu

# Prefer explicit DB_HOST/DB_PORT; otherwise use MYSQL_HOST/MYSQL_PORT from env_file.
# Fall back to the Compose service name (db) which is the most reliable DNS name.
DB_HOST="${DB_HOST:-${MYSQL_HOST:-db}}"
DB_PORT="${DB_PORT:-${MYSQL_PORT:-3306}}"

echo "[backend]  | Waiting for database at ${DB_HOST}:${DB_PORT}..."

# Busybox/alpine nc returns nonzero until connect succeeds.
while ! nc -z "$DB_HOST" "$DB_PORT" >/dev/null 2>&1; do
  sleep 2
done

echo "[backend]  | [Entrypoint] Database is ready :)"

exec "$@"
