.PHONY: all dev up down rebuild ensure-env

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

rebuild: ensure-env
	@echo "Destroying everything..."
	@docker compose -f ./srcs/compose.yaml down -v || true
	@echo "Removing old images..."
	@docker rmi -f nest_backend mariadb 2>/dev/null || true
	@echo "Building without cache..."
	@docker compose -f ./srcs/compose.yaml build --no-cache
	@docker compose -f ./srcs/compose.yaml up