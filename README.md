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

### 2. Build and start the stack
```bash
make
```
This will:
- Build the Docker images (frontend assets baked into nginx)
- Start the backend and nginx containers in the background
- Set up the database volume

### 3. Access the application
- **Frontend**: http://localhost:8000 or https://localhost:8443
- **Backend API**: http://localhost:3000
- **Prisma Studio**: Run `make studio` then visit http://localhost:5555

## Available Commands

```bash
make                # Build images and start backend + nginx (same as prod)
make prod           # Build images and start backend + nginx
make build          # Build images only
make start          # Start existing containers
make stop           # Stop containers
make down           # Stop and remove containers
make clean          # Stop containers and remove volumes (deletes database!)
make migrate        # Apply Prisma migrations (development, optional)
```

## Development Workflow

### View database with Prisma Studio
```bash
make studio
```
Then open http://localhost:5555

### View backend logs
```bash
make logs
```

### View frontend logs
```bash
make flog
```

### Access backend shell
```bash
docker compose exec backend sh
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
- If schema changed, apply migrations (development): `make migrate`
- Check the database is inside the container, not on your local machine

### Container issues
If containers won't start:
- Clean everything: `make clean`
- Rebuild: `make`

### Port conflicts
If ports 3000, 5555, or 8443 are already in use:
- Stop the conflicting service
- Or modify the ports in `docker-compose.yml`