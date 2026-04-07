#!/bin/sh

echo "[Entrypoint] Waiting for MySQL..."

until nc -z db 3306; do
  echo "Waiting for database..."
  sleep 2
done

echo "[Entrypoint] Database is ready :)"

exec "$@"
