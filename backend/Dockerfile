#  Etapa builder
FROM node:22.12.0 AS builder
WORKDIR /app

# 1) Instala dependencias
COPY package*.json tsconfig.json ./
RUN npm ci

# 2) Copia y compila
COPY . .
RUN npm run build

# Etapa final (prod)
FROM node:22.12.0-slim
WORKDIR /app

# 1) Copia solo package.json y lockfile, luego instala prod deps
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

# 1.1) Instala pg_isready para el healthcheck
RUN apt-get update \
 && apt-get install -y postgresql-client \
 && rm -rf /var/lib/apt/lists/*

# 2) Copia el build
COPY --from=builder /app/dist ./dist

EXPOSE 4000

# 3) Espera a Postgres, corre migraciones compiladas y arranca
CMD ["sh", "-c", "\
  until pg_isready -h postgres -p 5432; do \
    echo 'Esperando a Postgres…'; \
    sleep 1; \
  done; \
  npm run migration:run:prod && npm run start:prod\
"]


# !# Etapa builder
# FROM node:22.12.0 AS builder
# WORKDIR /app

# # 1) Instala dependencias
# COPY package*.json tsconfig.json ./
# RUN npm ci

# # 2) Copia el código fuente
# COPY src ./src

# # 3) Compila TypeScript (incluye src/migrations si está bajo src/)
# RUN npm run build

# # 4) Copia las migraciones TS para luego compilarlas o ejecutarlas
# #    En este punto las migraciones .ts siguen en /app/src/migrations
# #    Si quieres ejecutarlas con ts-node, podrías usarlas directamente.
# #    Pero como en producción ejecutaremos las .js generadas,
# #    vamos a copiarlas del src original para que tsc las haya convertido.
# #    (Si tu tsconfig no las compila, este paso asegura que existan)
# RUN mkdir -p dist/migrations
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

