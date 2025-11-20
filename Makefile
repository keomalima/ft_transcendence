COMPOSE = docker compose -f ./docker-compose.yml

all: dev

# Development mode: backend in Docker, frontend local with hot-reload
dev:
	@echo "🚀 Starting DEVELOPMENT mode..."
	@echo "📦 Starting backend in Docker..."
	$(COMPOSE) up backend
	@echo "⏳ Waiting for backend to be ready..."
	@sleep 3
	@echo "✨ Starting frontend locally with hot-reload..."
	@echo "💡 Tip: Run 'make logs' in another terminal to see backend logs"
	cd frontend && npm run serve

# Production/Release mode: both services in Docker
prod:
	@echo "🏭 Starting PRODUCTION mode..."
	@echo "📦 Building frontend..."
	cd frontend && npm run build
	@echo "📦 Starting all services in Docker..."
	$(COMPOSE) up --build -d
	@echo "✅ Services started!"
	@echo "   Frontend: http://localhost:4173"
	@echo "   Backend:  http://localhost:3000"

# Alternative: same as prod
release:
	@echo "🏭 Starting RELEASE mode..."
	@echo "📦 Building frontend..."
	cd frontend && npm run build
	@echo "📦 Starting all services in Docker..."
	$(COMPOSE) up --build -d
	@echo "✅ Services started!"
	@echo "   Frontend: http://localhost:4173"
	@echo "   Backend:  http://localhost:3000"

build:
	$(COMPOSE) up --build

start:
	$(COMPOSE) start

stop:
	$(COMPOSE) stop

down:
	$(COMPOSE) down

clean:
	$(COMPOSE) down -v
	docker rmi ft_transcendence-backend:latest ft_transcendence-frontend:latest

studio:
	$(COMPOSE) exec backend npx prisma studio

migrate:
	$(COMPOSE) exec backend npx prisma migrate dev

logs:
	$(COMPOSE) logs -f backend

.PHONY: clean build start stop down studio migrate logs
