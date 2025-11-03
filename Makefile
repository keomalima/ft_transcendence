COMPOSE = docker compose -f ./docker-compose.yml

all: build

build:
	$(COMPOSE) up --build

build-terminal: 
	$(COMPOSE) up --build

start:
	$(COMPOSE) start

stop:
	$(COMPOSE) stop

down:
	$(COMPOSE) down

clean:
	$(COMPOSE) down -v

studio:
	$(COMPOSE) exec backend npx prisma studio

migrate:
	$(COMPOSE) exec backend npx prisma migrate dev

logs:
	$(COMPOSE) logs -f backend

.PHONY: clean build start stop down studio migrate logs