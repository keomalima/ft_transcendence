FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package*.json tsconfig.json tailwind.config.json ./
RUN npm ci

COPY src ./src
COPY index.html style.css ./

RUN npm run build && cp index.html dist/ && cp style.css dist/

