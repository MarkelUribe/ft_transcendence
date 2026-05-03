.PHONY: all dev up down rebuild ensure-env restore

ENV_FILE := ./srcs/.env
ENV_EXAMPLE := ./srcs/.env.example

all: ensure-env
#Create SSL certs and jwt secret
	@mkdir -p secrets/ssl
	@if [ ! -f secrets/db_password.txt ]; then\
		openssl rand -base64 48 > secrets/db_password.txt;\
		chmod 600 secrets/db_password.txt;\
		echo "[make] Created secrets/db_password.txt";\
	fi
	@if [ ! -f secrets/db_root_password.txt ]; then\
		openssl rand -base64 48 > secrets/db_root_password.txt;\
		chmod 600 secrets/db_root_password.txt;\
		echo "[make] Created secrets/db_root_password.txt";\
	fi
	@if [ ! -f secrets/ssl/localhost.key ] || [ ! -f secrets/ssl/localhost.crt ]; then \
		openssl req -x509 -nodes -newkey rsa:2048 \
			-keyout secrets/ssl/localhost.key \
			-out secrets/ssl/localhost.crt \
			-days 365 \
			-subj "/CN=localhost" \
			-addext "subjectAltName=DNS:localhost,IP:127.0.0.1"; \
	fi
	@if [ ! -f secrets/jwt_secret.txt ]; then\
		openssl rand -base64 48 > secrets/jwt_secret.txt;\
		chmod 600 secrets/jwt_secret.txt;\
		echo "[make] Created secrets/jwt_secret.txt";\
	fi

ensure-env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		if [ -f "$(ENV_EXAMPLE)" ]; then \
			cp "$(ENV_EXAMPLE)" "$(ENV_FILE)"; \
			echo "[make] Created $(ENV_FILE) from $(ENV_EXAMPLE)."; \
			echo "[make] Edit $(ENV_FILE) and re-run: make up"; \
			exit 1; \
		else \
			echo "[make] Missing $(ENV_EXAMPLE). Cannot generate $(ENV_FILE)."; \
			exit 1; \
		fi; \
	fi

dev: all
	@sh -eu -c 'cleanup(){ printf "\n[make] Stopping dev stack...\n"; podman-compose -f ./srcs/compose.yaml -f ./srcs/compose.dev.yaml down >/dev/null 2>&1 || true; }; trap cleanup EXIT INT TERM; podman-compose -f ./srcs/compose.yaml -f ./srcs/compose.dev.yaml down >/dev/null 2>&1 || true; podman-compose -f ./srcs/compose.yaml -f ./srcs/compose.dev.yaml up'
up: all
	@sh -c 'set -eu; \
		trap "echo \"\n[make] Caught Ctrl+C → stopping stack...\"; podman-compose -f ./srcs/compose.yaml down -v >/dev/null 2>&1 || true" INT TERM; \
		podman-compose -f ./srcs/compose.yaml up --build'

down:
	@podman-compose -f ./srcs/compose.yaml -f ./srcs/compose.dev.yaml down -v 2>/dev/null || true
	@podman-compose -f ./srcs/compose.yaml down -v || true
	@podman rm -f $$(podman ps -aq --filter label=io.podman.compose.project=srcs) 2>/dev/null || true
	@podman volume rm $$(podman volume ls -q --filter label=io.podman.compose.project=srcs) 2>/dev/null || true
	@podman network rm srcs_transcendence_net 2>/dev/null || true

rebuild: ensure-env
	@echo "Destruyendo todo..."
	@podman-compose -f ./srcs/compose.yaml down -v || true
	@echo "Limpiando volúmenes residuales..."
	@podman volume rm $$(podman volume ls -q --filter label=io.podman.compose.project=srcs) 2>/dev/null || true
	@echo "Borrando imágenes viejas..."
	@podman rmi -f nest_backend mariadb 2>/dev/null || true
	@echo "Construyendo sin caché..."
	@podman-compose -f ./srcs/compose.yaml build --no-cache
	@podman-compose -f ./srcs/compose.yaml up

restore:
	podman exec -i mariadb mariadb -u myuser -p'mypassword' -e "DROP DATABASE IF EXISTS transcendence; CREATE DATABASE transcendence;"
	
	@BACKUP_FILE=$$(ls srcs/backups/*.sql | sort -V | tail -1); \
	if [ -z "$$BACKUP_FILE" ]; then \
		echo "❌ No se encontró ningún backup en srcs/backups/"; \
		exit 1; \
	fi; \
	echo "🚀 Restaurando desde: $$BACKUP_FILE"; \
	podman cp $$BACKUP_FILE mariadb:/tmp/backup.sql && \
	podman exec mariadb mariadb -u myuser -p'mypassword' transcendence -e "source /tmp/backup.sql"; \
	echo "✅ Backup aplicado correctamente."

restoreoldold:
	podman exec -i mariadb mariadb -u myuser -p'mypassword' -e "DROP DATABASE IF EXISTS transcendence; CREATE DATABASE transcendence;"
	ls srcs/backups | column -t | grep '\.sql' |  awk -F '_' '{ print $$2 }' | tr -d '\.sql' | sort -n | tail -1 | xargs -I {} grep {} <(ls ./srcs/backups | column -t | grep sql) | xargs -I {} podman cp {} mariadb:/tmp/backup.sql | xargs podman exec mariadb mariadb -u myuser -p'mypassword' transcendence -e "source /tmp/backup.sql" 
	make
