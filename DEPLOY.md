# The HUD — Deployment

## Stack
- Client: React + Vite → nginx static + WS proxy (port 3000)
- Server: Hono + WebSockets on port 3001
- DB: Postgres 16 (volume: hud_pgdata)

## Deploy to VPS via Dokploy

### 1. Push to GitHub
```
cd /mnt/e/Dnd-hud/the-hud
git add -A
git commit -m "Phase 5 polish — responsive layout, toasts, session log"
git push origin main
```

### 2. Create app in Dokploy
- Type: Docker Compose
- Source: GitHub → TheOriginalRobbiP/the-hud
- Compose file: docker-compose.yml
- Build path: / (root)

### 3. Set environment variables in Dokploy
```
POSTGRES_PASSWORD=<strong-password>
```
DATABASE_URL is derived automatically from the compose file.

### 4. Domains (Dokploy → Domains tab)
- Add `dnd.rjp.digital` → container: the-hud-client, port: 80, HTTPS on

### 5. First deploy
After first successful deploy, run DB migrations + seed:
- Dokploy → Applications → the-hud-server → Terminal (or SSH to VPS)
```
docker exec <server-container-id> node server/dist/db/seed.js
```
Or from VPS:
```
docker exec $(docker ps -qf name=the-hud-server) node server/dist/db/seed.js
```

### 6. Verify
- https://dnd.rjp.digital → Role Selector screen
- Open in two tabs → pick GM in one, Player in other
- GM edits HP → player sees change within 2-3s

## Local dev
```
docker compose -f docker-compose.dev.yml up
```
- Client: http://localhost:5173
- Server: http://localhost:3002
