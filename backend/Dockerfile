# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22.12.0-alpine AS builder
WORKDIR /app

# Install all dependencies (dev included for the TypeScript build)
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source and compile
COPY src ./src
RUN npm run build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:22.12.0-alpine AS production
WORKDIR /app

# Install postgresql-client for pg_isready in the entrypoint
RUN apk add --no-cache postgresql-client

# Copy package manifests and install only production dependencies
COPY --from=builder --chown=node:node /app/package*.json ./
RUN npm ci --omit=dev

# Copy compiled application
COPY --from=builder --chown=node:node /app/dist ./dist

# Copy the pre-trained NLP model (loaded at runtime from working directory)
COPY --chown=node:node model.nlp ./model.nlp

# Copy and make the entrypoint executable (must be done as root before USER switch)
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 4000

# Run as non-root for security
USER node

ENTRYPOINT ["./entrypoint.sh"]
# COPY src/migrations ./dist/migrations

# # Etapa final
# FROM node:22.12.0-slim
# WORKDIR /app

# # Copia package.json y dist completo
# COPY --from=builder /app/package*.json ./
# COPY --from=builder /app/dist ./dist

# # Instala sólo prod dependencies
# RUN npm ci --omit=dev

# EXPOSE 4000

# # Ejecuta migraciones y luego arranca
# CMD ["sh", "-c", "npm run migration:run && npm run start"]

