# The HUD — Dungeon Crawler Carl Companion App

Real-time multiplayer session companion for DCC campaigns.
GM controls HP, Room Target, and loot. Players see their HUD update instantly.

## Quick Start (local dev)

```bash
# 1. Install deps
npm install

# 2. Set up server env
cp server/.env.example server/.env
# Edit server/.env — add your DATABASE_URL

# 3. Push DB schema
npm run db:push --workspace=server

# 4. Start server
npm run dev:server

# 5. Start client (new terminal)
npm run dev:client
```

Client runs on http://localhost:5173
Server runs on http://localhost:3001

## Deployment (Dokploy / VPS)

Uses docker-compose.yml. Set POSTGRES_PASSWORD in Dokploy env vars.

## Stack

- Client: React + TypeScript + Tailwind + Vite
- Server: Hono + TypeScript + Drizzle ORM + WebSockets
- DB: PostgreSQL
- Hosting: Dokploy (VPS)

## Spec

See DCC_HUD_Spec_v1.1.md for full product specification.
