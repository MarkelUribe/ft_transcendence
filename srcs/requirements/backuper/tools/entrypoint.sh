#!/bin/bash

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y mariadb-client
apt-get install -y rsync
apt-get install -y cron
apt-get install -y apache2
apt-get install -y netcat-openbsd
chmod 444 /run/secrets/db_root_password || true
touch /var/log/cron.log
echo "Creating new backup"
mariadb-dump -h db -u root -p$(cat /run/secrets/db_root_password) --ssl=0 --protocol=tcp transcendence > /backups/transcendence_$(date +%Y%m%d%H).sql
rsync --checksum -r -v /run/secrets > /backups/transcendence_$(date +%Y%m%d%H)_secrets

echo "Creating cronjob with backup to execute it every 24 hours"
echo '
/usr/bin/mariadb-dump -h db -u root -p$(cat /run/secrets/db_root_password) --ssl=0 --protocol=tcp transcendence > /backups/transcendence_$(date +%Y%m%d%H).sql
/usr/bin/rsync --checksum -r -v /run/secrets > /backups/transcendence_$(date +%Y%m%d%H)_secrets
' > /tmp/cronjob.sh

echo "Inserting job in root's crontab"
chmod 755 /tmp/cronjob.sh
echo "0 * * * * /tmp/cronjob.sh" | crontab -

# Only modify ports.conf if it hasn't been modified yet to avoid syntax errors on restart
if ! grep -q "Listen 8080" /etc/apache2/ports.conf; then
    sed -i 's/Listen 80/Listen 8080/g' /etc/apache2/ports.conf
    sed -i 's/<VirtualHost \*:80>/<VirtualHost \*:8080>/g' /etc/apache2/sites-available/000-default.conf
fi
echo "Starting Apache Web Server on port 8080..."

source /etc/apache2/envvars

mkdir -p /var/run/apache2
export APACHE_RUN_DIR=/var/run/apache2
export APACHE_RUN_USER=www-data
export APACHE_RUN_GROUP=www-data
export APACHE_LOG_DIR=/var/log/apache2
export APACHE_PID_FILE=/var/run/apache2/apache2.pid
exec apache2 -DFOREGROUND

cron && tail -f /var/log/cron.log
