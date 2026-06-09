.PHONY: all dev up down rebuild ensure-env clean-secrets clean fclean reset re restore

ENV_FILE := ./srcs/.env
ENV_EXAMPLE := ./srcs/.env.example

# DRY: Define the base docker compose commands as variables
DC 		:= docker compose -f ./srcs/compose.yaml
DC_DEV 	:= $(DC) -f ./srcs/compose.dev.yaml

# `make all`: Prepare local environment by creating secrets first, then ensuring the `.env` file exists.
# Running `make` once will generate secrets and the env file (if missing). Edit `srcs/.env` then run `make up`.
all: create-secrets ensure-env

# Create any missing secrets (DB passwords, JWT secret, and local TLS certs).
create-secrets:
	@mkdir -p secrets/ssl; \
	SECRET_CREATED=0; \
	if [ ! -f secrets/db_password.txt ]; then \
		openssl rand -base64 48 > secrets/db_password.txt; \
		chmod 600 secrets/db_password.txt; \
		echo "[make] Created secrets/db_password.txt"; \
		SECRET_CREATED=1; \
	fi; \
	if [ ! -f secrets/db_root_password.txt ]; then \
		openssl rand -base64 48 > secrets/db_root_password.txt; \
		chmod 600 secrets/db_root_password.txt; \
		echo "[make] Created secrets/db_root_password.txt"; \
		SECRET_CREATED=1; \
	fi; \
	if [ ! -f secrets/ssl/localhost.key ] || [ ! -f secrets/ssl/localhost.crt ]; then \
		openssl req -x509 -nodes -newkey rsa:2048 \
			-keyout secrets/ssl/localhost.key \
			-out secrets/ssl/localhost.crt \
			-days 365 \
			-subj "/CN=localhost" \
			-addext "subjectAltName=DNS:localhost,IP:127.0.0.1"; \
		echo "[make] Created secrets/ssl/localhost.key and localhost.crt"; \
		SECRET_CREATED=1; \
	fi; \
	if [ ! -f secrets/jwt_secret.txt ]; then \
		openssl rand -base64 48 > secrets/jwt_secret.txt; \
		chmod 600 secrets/jwt_secret.txt; \
		echo "[make] Created secrets/jwt_secret.txt"; \
		SECRET_CREATED=1; \
	fi; \
	if [ $$SECRET_CREATED -eq 1 ]; then \
		printf "==========================================================================\n"; \
		printf " [make] Secrets created randomly. Change if wanted.\n"; \
		printf "==========================================================================\n"; \
	fi

# `make ensure-env`: If `srcs/.env` is missing, copy from the example and inform the user
# to edit VITE_API_URL (set it to your host LAN IP) before running `make up`.
ensure-env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		if [ -f "$(ENV_EXAMPLE)" ]; then \
			cp "$(ENV_EXAMPLE)" "$(ENV_FILE)"; \
			printf "==========================================================================\n"; \
			printf " [make] Created ./srcs/.env from ./srcs/.env.example.\n"; \
			printf "   IMPORTANT: Edit ./srcs/.env and change the variables appropriately\n"; \
			printf "   specifically VITE_API_URL to your locally hosted IP to run on network!\n"; \
			printf "   Once configured, run 'make up' or 'make dev'.\n"; \
			printf "==========================================================================\n"; \
			exit 0; \
		else \
			echo "[make] Missing $(ENV_EXAMPLE). Cannot generate $(ENV_FILE)."; \
			exit 1; \
		fi; \
	else \
		printf "==========================================================================\n"; \
		printf " [make] ./srcs/.env already created.\n"; \
		printf "==========================================================================\n"; \
	fi

# `make dev`: Starts the environment with hot-reloading dev overlays for frontend & backend.
dev: all
	@sh -eu -c ' \
		cleanup() { $(DC_DEV) down --timeout 0 >/dev/null 2>&1 || true; }; \
		trap "printf \"\n[make] Stopping dev stack...\n\"; cleanup; exit 0" INT TERM; \
		$(DC_DEV) up --build & \
		compose_pid=$$!; \
		wait "$$compose_pid" \
	'

# `make up`: Standard start target. Starts the production-style stack with build cache enabled.
up: all
	@sh -c 'set -eu; \
		cleanup() { $(DC) down -v --timeout 0 >/dev/null 2>&1 || true; }; \
		trap "printf \"\n[make] Caught Ctrl+C -> stopping stack...\n\"; cleanup; exit 0" INT TERM; \
		$(DC) up --build & \
		compose_pid=$$!; \
		wait "$$compose_pid" \
	'

# `make down`: Stops all running containers from both dev and production-style compose files, and auto-prunes basic system resources.
down:
	@$(DC_DEV) down -v 2>/dev/null || true
	@$(DC) down -v || true
	@docker system prune -f >/dev/null 2>&1 || true

# `make clean`: 42-style target; acts as an alias for `down` to clean runtime resources (containers/volumes).
clean: down

# `make clean-secrets`: Helper target to strictly remove the dynamically generated secrets folder and all passwords/keys/certs inside.
clean-secrets:
	@echo "[make] Removing generated secrets..."
	@rm -f secrets/db_password.txt secrets/db_root_password.txt secrets/jwt_secret.txt
	@rm -f secrets/ssl/localhost.key secrets/ssl/localhost.crt
	@rmdir secrets/ssl 2>/dev/null || true
	@rmdir secrets 2>/dev/null || true

# `make fclean`: Fully reset the project: stop/remove containers + volumes, delete generated secrets, and remove built images.
# After running: `make up` (will regenerate secrets and rebuild).
fclean: down clean-secrets
	@echo "[make] Removing project images (if present)..."
	@docker rmi -f nest_backend mariadb svelte_frontend 2>/dev/null || true
	@echo "[make] Full clean done. Next: make up"

# `make reset`: Alias: more explicit name for `fclean` for evaluators and teammates
reset: fclean

# `make re`: 42-style target; full clean + restart.
re: fclean up

# `make rebuild`: Force destruction of containers/volumes/images and rebuilds directly via Docker compose without cache, bypassing complete Makefile clean state.
rebuild: ensure-env
	@echo "Destroying everything..."
	@$(DC) down -v || true
	@echo "Removing old images..."
	@docker rmi -f nest_backend mariadb svelte_frontend 2>/dev/null || true
	@echo "Building without cache..."
	@$(DC) build --no-cache
	@$(DC) up

# `make restore`: Retrieves the most recently created timestamped backup SQL file from `/srcs/backups` and injects its contents seamlessly into the live MariaDB database.
restore:
	@docker exec -i mariadb mariadb -u myuser -p'mypassword' \
		-e "DROP DATABASE IF EXISTS transcendence; CREATE DATABASE transcendence;"
	@BACKUP_FILE=$$(ls srcs/backups/*.sql 2>/dev/null | sort -V | tail -1); \
	if [ -z "$$BACKUP_FILE" ]; then \
		echo "❌ No se encontró ningún backup en srcs/backups/"; \
		exit 1; \
	fi; \
	echo "🚀 Restaurando desde: $$BACKUP_FILE"; \
	docker cp $$BACKUP_FILE mariadb:/tmp/backup.sql && \
	docker exec mariadb mariadb -u myuser -p'mypassword' \
		transcendence -e "source /tmp/backup.sql"; \
	echo "✅ Backup aplicado correctamente."

# `make restoreoldold`: Legacy version of restore script utilizing more complex awk grep piping to find the most recent backup SQL database state before restoration
restoreoldold:
	@docker exec -i mariadb mariadb -u myuser -p'mypassword' \
		-e "DROP DATABASE IF EXISTS transcendence; CREATE DATABASE transcendence;"
	@ls srcs/backups | column -t | grep '\.sql' \
		| awk -F '_' '{ print $$2 }' | tr -d '\.sql' | sort -n | tail -1 \
		| xargs -I {} grep {} <(ls ./srcs/backups | column -t | grep sql) \
		| xargs -I {} docker cp {} mariadb:/tmp/backup.sql \
		| xargs docker exec mariadb mariadb -u myuser -p'mypassword' \
			transcendence -e "source /tmp/backup.sql"
	make
