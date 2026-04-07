#!/bin/bash
set -e

echo "User: $POSTGRES_USER"
echo "Database: $POSTGRES_DB"

psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\l"
