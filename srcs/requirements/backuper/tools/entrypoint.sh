#!/bin/bash

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y mariadb-client
apt-get install -y rsync
apt-get install -y cron
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

cron && tail -f /var/log/cron.log
