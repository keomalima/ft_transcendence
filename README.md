# ft_transcendence

A full-stack web application built with Fastify (backend) and a frontend service.

## Prerequisites

- Docker and Docker Compose installed
- Git

## Setup Instructions (New Computer)

### 1. Clone the repository
```bash
git clone <repository-url>
cd ft_transcendence
```

### 2. Build and start the containers
```bash
make build
```
This will:
- Build the Docker images for backend and frontend
- Start all services
- Set up the database volume

### 3. Run database migrations
After the containers are running, in a new terminal:
```bash
make migrate
```

### 4. (Optional) Seed the database
If you have seed data:
```bash
docker compose exec backend npx prisma db seed
```

### 5. Access the application
- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:3000
- **Prisma Studio**: Run `docker compose exec backend npx prisma studio` then visit http://localhost:5555

## Available Commands

```bash
make build          # Build and start containers
make start          # Start existing containers
make stop           # Stop containers
make down           # Stop and remove containers
make clean          # Stop containers and remove volumes (deletes database!)
```

## Development Workflow

### View database with Prisma Studio
```bash
docker compose exec backend npx prisma studio
```
Then open http://localhost:5555

### View backend logs
```bash
docker compose logs -f backend
```

### Access backend shell
```bash
docker compose exec backend sh
```

### Reset database (development only!)
```bash
docker compose exec backend npx prisma migrate reset
```

## Project Structure

```
.
├── backend/           # Fastify backend API
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── plugins/  # Fastify plugins
│   │   └── server.ts # Entry point
│   └── prisma/
│       └── schema.prisma
├── frontend/         # Frontend application
└── docker-compose.yml
```

## Troubleshooting

### Database issues
If you're not seeing data or having database issues:
- Make sure containers are running: `docker compose ps`
- Run migrations: `docker compose exec backend npx prisma migrate dev`
- Check the database is inside the container, not on your local machine

### Container issues
If containers won't start:
- Clean everything: `make clean`
- Rebuild: `make build`

### Port conflicts
If ports 3000, 5555, or 8000 are already in use:
- Stop the conflicting service
- Or modify the ports in `docker-compose.yml`