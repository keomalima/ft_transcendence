COMPOSE = docker compose -f ./docker-compose.yml

all: dev-local

# Development mode: backend in Docker, frontend local (hot reload)
dev-local:
	@echo "🚀 Starting DEVELOPMENT (local frontend) ..."
	@echo "📦 Starting backend in Docker..."
	$(COMPOSE) up -d backend
	@echo "⏳ Waiting for backend to be ready..."
	@sleep 3
	@echo "✨ Starting frontend locally with hot-reload..."
	@echo "💡 Tip: Run 'make logs' in another terminal to see backend logs"
	cd frontend && API_BASE_URL=http://localhost:3000 npm run start

# Development mode: backend + frontend both in Docker (hot reload via bind mounts)
dev:
	@echo "🚀 Starting DEVELOPMENT (frontend in Docker) ..."
	$(COMPOSE) up -d backend frontend
	@echo "✅ Frontend: http://localhost:5173"
	@echo "✅ Backend:  http://localhost:3000"

# Production/Release mode: both services in Docker
prod:
	@echo "🏭 Starting PRODUCTION mode..."
	@echo "📦 Building images (frontend assets baked into nginx)..."
	$(COMPOSE) up --build -d backend nginx
	@echo "✅ Services started!"
	@echo "   Frontend: https://localhost:8443"

# Alternative: same as prod
release:
	@echo "🏭 Starting RELEASE mode..."
	@echo "📦 Building images (frontend assets baked into nginx)..."
	$(COMPOSE) up --build -d backend nginx
	@echo "✅ Services started!"
	@echo "   Frontend: http://localhost"
	@echo "   Backend:  http://localhost:3000"

build:
	$(COMPOSE) build

start:
	$(COMPOSE) start

stop:
	$(COMPOSE) stop

down:
	$(COMPOSE) down

clean:
	$(COMPOSE) down -v
	docker rmi ft_transcendence-backend:latest ft_transcendence-nginx:latest

studio:
	$(COMPOSE) exec backend npx prisma studio

migrate:
	$(COMPOSE) exec backend npx prisma migrate dev

logs:
	$(COMPOSE) logs -f backend

flog:
	$(COMPOSE) logs -f frontend

.PHONY: clean build start stop down studio migrate logs dev-local dev-docker prod release
