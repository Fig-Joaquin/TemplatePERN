# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:22.12.0-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY . .

# VITE_API_URL is baked into the bundle at build time.
# In production (docker-compose), this is set to /api so Nginx can proxy it.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ─── Stage 3: Production with Nginx ─────────────────────────────────────────
FROM nginx:stable-alpine AS production

# Copy compiled React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (SPA routing + /api proxy to backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
