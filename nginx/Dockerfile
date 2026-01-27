# Stage 1: build the frontend assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY frontend/package*.json frontend/tsconfig.json frontend/tailwind.config.js ./
RUN npm ci

COPY frontend/src ./src
COPY frontend/index.html frontend/style.css ./

RUN npm run build \
	&& cp index.html dist/ \
	&& cp style.css dist/ \
	&& mkdir -p dist/src \
	&& cp -r src/images dist/src/

# Stage 2: nginx runtime
FROM nginx:alpine
RUN apk add --no-cache openssl
RUN mkdir -p /etc/nginx/ssl \
	&& openssl req -x509 -nodes -days 365 -newkey rsa:2048 -subj "/CN=localhost" \
		-keyout /etc/nginx/ssl/selfsigned.key \
		-out /etc/nginx/ssl/selfsigned.crt

COPY nginx/conf/nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

EXPOSE 80 443
