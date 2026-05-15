#!/bin/sh
set -e

echo "[startup] Running DB migrations..."
cd /app/server && npx drizzle-kit push

echo "[startup] Seeding floor state..."
node /app/server/dist/db/seed.js

echo "[startup] Seeding characters..."
node /app/server/dist/db/characters-seed.js

echo "[startup] Starting server..."
exec node /app/server/dist/index.js
