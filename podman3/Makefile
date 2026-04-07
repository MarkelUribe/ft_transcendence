.PHONY: up down rebuild

up:
	@podman compose -f ./srcs/compose.yaml up --build

down:
	@podman compose -f ./srcs/compose.yaml down -v

rebuild:
	@echo "Destruyendo todo..."
	@podman compose -f ./srcs/compose.yaml down -v
	@echo "Limpiando volúmenes residuales..."
	@podman volume rm $$(podman volume ls -q) 2>/dev/null || true
	@echo "Borrando imágenes viejas..."
	@podman rmi -f nest_backend mariadb 2>/dev/null || true
	@echo "Construyendo sin caché..."
	@podman compose -f ./srcs/compose.yaml build --no-cache
	@podman compose -f ./srcs/compose.yaml up
