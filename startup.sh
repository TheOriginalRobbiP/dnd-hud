#!/bin/sh
set -e

echo "[startup] Running DB migrations..."
cd /app && npm run db:push --workspace=server

echo "[startup] Seeding floor state..."
cd /app && node server/dist/db/seed.js

echo "[startup] Seeding characters..."
cd /app && node server/dist/db/characters-seed.js

echo "[startup] Starting server..."
exec node server/dist/index.js
