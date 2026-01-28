COMPOSE = docker compose -f ./docker-compose.yml

all: prod

prod:
	@echo "🏭 Starting PRODUCTION mode..."
	@echo "📦 Building images (frontend assets baked into nginx)..."
	$(COMPOSE) up --build -d backend nginx
	@echo "✅ Services started!"
	@echo "   Frontend: https://localhost:8443"

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

.PHONY: clean build start stop down studio migrate logs prod 
