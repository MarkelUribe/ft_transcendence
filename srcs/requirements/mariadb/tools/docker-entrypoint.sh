#!/bin/bash
set -e

echo "[Entrypoint] Custom MariaDB entrypoint starting..."

# Cargar secretos (esto está bien)
if [ -f /run/secrets/db_password ]; then
    export MYSQL_PASSWORD=$(cat /run/secrets/db_password)
    echo "[Entrypoint] Loaded MYSQL_PASSWORD from secret"
fi

if [ -f /run/secrets/db_root_password ]; then
    export MYSQL_ROOT_PASSWORD=$(cat /run/secrets/db_root_password)
    echo "[Entrypoint] Loaded MYSQL_ROOT_PASSWORD from secret"
fi

# PROCESAR EL TEMPLATE SIN USAR 'sed -i'
if [ -f /docker-entrypoint-initdb.d/init.sql.template ]; then
    echo "[Entrypoint] Processing init.sql.template..."
    
    # Usamos cat y redirección a un archivo nuevo. 
    # Si /docker-entrypoint-initdb.d da error, podrías usar /tmp/init.sql 
    # y luego moverlo, pero intentemos esto primero:
    
    sed "s|\${MYSQL_DATABASE}|${MYSQL_DATABASE}|g; \
         s|\${MYSQL_USER}|${MYSQL_USER}|g; \
         s|\${MYSQL_PASSWORD}|${MYSQL_PASSWORD}|g; \
         s|\${MYSQL_ROOT_PASSWORD}|${MYSQL_ROOT_PASSWORD}|g" \
         /docker-entrypoint-initdb.d/init.sql.template > /docker-entrypoint-initdb.d/init.sql

    # Borramos el template para que MariaDB no intente ejecutarlo (si es que puede)
    rm /docker-entrypoint-initdb.d/init.sql.template
    
    echo "[Entrypoint] Generated init.sql"
fi

echo "[Entrypoint] Delegating to official MariaDB entrypoint..."
exec /usr/local/bin/docker-entrypoint.sh "$@"
