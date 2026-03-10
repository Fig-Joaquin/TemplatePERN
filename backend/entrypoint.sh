#!/bin/sh
set -e

# ─── 1. Wait for PostgreSQL ───────────────────────────────────────────────────
echo "⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}"; do
  echo "   PostgreSQL is not ready yet — retrying in 3s..."
  sleep 3
done
echo "✅ PostgreSQL is ready."

# ─── 2. Run TypeORM migrations ───────────────────────────────────────────────
echo "🔄 Running database migrations..."
npm run migration:run:prod
echo "✅ Migrations complete."

# ─── 3. Run seeders ──────────────────────────────────────────────────────────
echo "🌱 Running seeders..."
node dist/scripts/seedAdminUser.js
echo "✅ Seeders complete."

# ─── 4. Start the application ────────────────────────────────────────────────
echo "🚀 Starting application..."
exec node dist/index.js
