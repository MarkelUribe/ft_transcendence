.PHONY: all dev up down rebuild ensure-env clean-secrets clean fclean reset re restore

ENV_FILE := ./srcs/.env
ENV_EXAMPLE := ./srcs/.env.example

all: ensure-env
# Create SSL certs and jwt secret
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
	@sh -eu -c '\
	cleanup(){ \
		printf "\n[make] Stopping dev stack...\n"; \
		docker compose -f ./srcs/compose.yaml -f ./srcs/compose.dev.yaml down >/dev/null 2>&1 || true; \
	}; \
	trap cleanup EXIT INT TERM; \
	docker compose -f ./srcs/compose.yaml -f ./srcs/compose.dev.yaml down >/dev/null 2>&1 || true; \
	docker compose -f ./srcs/compose.yaml -f ./srcs/compose.dev.yaml up --build'

up: all
	@sh -c 'set -eu; \
		trap "echo \"\n[make] Caught Ctrl+C → stopping stack...\"; docker compose -f ./srcs/compose.yaml down -v >/dev/null 2>&1 || true" INT TERM; \
		docker compose -f ./srcs/compose.yaml up --build'

down:
	@docker compose -f ./srcs/compose.yaml -f ./srcs/compose.dev.yaml down -v 2>/dev/null || true
	@docker compose -f ./srcs/compose.yaml down -v || true
	@docker system prune -f >/dev/null 2>&1 || true

# 42-style target: clean runtime resources (containers/volumes).
clean: down

clean-secrets:
	@echo "[make] Removing generated secrets..."
	@rm -f secrets/db_password.txt secrets/db_root_password.txt secrets/jwt_secret.txt
	@rm -f secrets/ssl/localhost.key secrets/ssl/localhost.crt
	@rmdir secrets/ssl 2>/dev/null || true
	@rmdir secrets 2>/dev/null || true

# Fully reset the project: stop/remove containers + volumes, delete generated secrets, and remove built images.
# After running: `make up` (will regenerate secrets and rebuild).
fclean: down clean-secrets
	@echo "[make] Removing project images (if present)..."
	@docker rmi -f nest_backend mariadb svelte_frontend 2>/dev/null || true
	@echo "[make] Full clean done. Next: make up"

# Alias: more explicit name for evaluators and teammates
reset: fclean

# 42-style target: full clean + restart.
re: fclean up

rebuild: ensure-env
	@echo "Destroying everything..."
	@docker compose -f ./srcs/compose.yaml down -v || true
	@echo "Removing old images..."
	@docker rmi -f nest_backend mariadb svelte_frontend 2>/dev/null || true
	@echo "Building without cache..."
	@docker compose -f ./srcs/compose.yaml build --no-cache
	@docker compose -f ./srcs/compose.yaml up

restore:
	docker exec -i mariadb mariadb -u myuser -p'mypassword' -e "DROP DATABASE IF EXISTS transcendence; CREATE DATABASE transcendence;"
	
	@BACKUP_FILE=$$(ls srcs/backups/*.sql | sort -V | tail -1); \
	if [ -z "$$BACKUP_FILE" ]; then \
		echo "❌ No se encontró ningún backup en srcs/backups/"; \
		exit 1; \
	fi; \
	echo "🚀 Restaurando desde: $$BACKUP_FILE"; \
	docker cp $$BACKUP_FILE mariadb:/tmp/backup.sql && \
	docker exec mariadb mariadb -u myuser -p'mypassword' transcendence -e "source /tmp/backup.sql"; \
	echo "✅ Backup aplicado correctamente."

restoreoldold:
	docker exec -i mariadb mariadb -u myuser -p'mypassword' -e "DROP DATABASE IF EXISTS transcendence; CREATE DATABASE transcendence;"
	ls srcs/backups | column -t | grep '\.sql' |  awk -F '_' '{ print $$2 }' | tr -d '\.sql' | sort -n | tail -1 | xargs -I {} grep {} <(ls ./srcs/backups | column -t | grep sql) | xargs -I {} docker cp {} mariadb:/tmp/backup.sql | xargs docker exec mariadb mariadb -u myuser -p'mypassword' transcendence -e "source /tmp/backup.sql" 
	make
