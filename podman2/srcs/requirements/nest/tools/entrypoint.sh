#!/bin/sh

echo "[Entrypoint] Waiting for PostgreSQL..."

until nc -z db 5432; do
  echo "Waiting for database..."
  sleep 2
done

echo "[Entrypoint] Database is ready :)"

exec "$@"
