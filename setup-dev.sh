#!/bin/bash
set -e

echo "=== The HUD — Dev Setup ==="

echo ""
echo "1. Building containers..."
docker compose -f docker-compose.dev.yml build

echo ""
echo "2. Starting DB..."
docker compose -f docker-compose.dev.yml up -d db

echo ""
echo "3. Waiting for DB to be ready..."
sleep 5

echo ""
echo "4. Running DB migrations..."
docker compose -f docker-compose.dev.yml run --rm server sh -c "cd /app && npm run db:push --workspace=server"

echo ""
echo "5. Starting all services..."
docker compose -f docker-compose.dev.yml up -d

echo ""
echo "=== Done ==="
echo "Client:  http://localhost:5173"
echo "Server:  http://localhost:3002"
echo "DB:      localhost:5432 (hud/hudpass/the_hud)"
echo ""
echo "Logs: docker compose -f docker-compose.dev.yml logs -f"
