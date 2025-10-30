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

.PHONY: clean build