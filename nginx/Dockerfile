# Stage 1: build the frontend assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Install dependencies using the frontend manifest and config
COPY frontend/package*.json frontend/tsconfig.json frontend/tailwind.config.js ./
RUN npm ci

# Bring in source and static entry files
COPY frontend/src ./src
COPY frontend/index.html frontend/style.css ./

# Build the app, ensure index/style land in dist, and copy static images for runtime
RUN npm run build \
	&& cp index.html dist/ \
	&& mkdir -p dist/src \
	&& cp -r src/images dist/src/

# Stage 2: nginx runtime
FROM nginx:alpine
# Install openssl to generate a local self-signed cert (dev-only)
RUN apk add --no-cache openssl
# Generate self-signed cert for HTTPS on localhost (valid 1 year)
RUN mkdir -p /etc/nginx/ssl \
	&& openssl req -x509 -nodes -days 365 -newkey rsa:2048 -subj "/CN=localhost" \
		-keyout /etc/nginx/ssl/selfsigned.key \
		-out /etc/nginx/ssl/selfsigned.crt
# Custom nginx config for proxying and static serving
COPY nginx/conf/nginx.conf /etc/nginx/nginx.conf
# Serve the built frontend from nginx default html root
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

EXPOSE 80 443
