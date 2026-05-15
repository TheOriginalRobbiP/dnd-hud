#!/bin/sh
set -e

echo "[startup] Running DB migrations..."
cd /app/server && npx drizzle-kit push

echo "[startup] Seeding floor state..."
cd /app && node server/dist/db/seed.js

echo "[startup] Seeding characters..."
cd /app && node server/dist/db/characters-seed.js

echo "[startup] Starting server..."
exec node server/dist/index.js
