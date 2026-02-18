# Paths
BACKEND_DIR=backend
FRONTEND_DIR=frontend

# Default target
.PHONY: all
all: dev

# ── Development ──
.PHONY: dev
dev:
	@echo "Starting backend..."
	@cd $(BACKEND_DIR) && npm run start:dev &
	@sleep 5
	@echo "Starting frontend..."
	@cd $(FRONTEND_DIR) && npm run dev

# ── Backend build
.PHONY: backend-build
backend-build:
	@cd $(BACKEND_DIR) && npm run build

# ── Frontend build
.PHONY: frontend-build
frontend-build:
	@cd $(FRONTEND_DIR) && npm run build

# ── Full production build
.PHONY: build
build: backend-build frontend-build
	@echo "Backend and frontend built."

# ── Clean
.PHONY: clean
clean:
	@cd $(BACKEND_DIR) && rm -rf dist
	@cd $(FRONTEND_DIR) && rm -rf build node_modules
	@echo "Cleaned backend and frontend."
