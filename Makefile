.PHONY: up down rebuild ensure-env

ENV_FILE := ./srcs/.env
ENV_EXAMPLE := ./srcs/.env.example

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

up: ensure-env
	@sh -c 'set -eu; \
		trap "echo \"\n[make] Caught Ctrl+C → stopping stack...\"; podman-compose -f ./srcs/compose.yaml down -v >/dev/null 2>&1 || true" INT TERM; \
		podman-compose -f ./srcs/compose.yaml up --build'

down:
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
