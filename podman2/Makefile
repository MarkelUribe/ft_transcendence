.PHONY: up down rebuild

up:
	@podman compose -f ./srcs/compose.yaml up --build

down:
	@podman compose -f ./srcs/compose.yaml down -v

rebuild:
	@podman compose -f ./srcs/compose.yaml down -v
	@podman compose -f ./srcs/compose.yaml build --no-cache
	@podman compose -f ./srcs/compose.yaml up
