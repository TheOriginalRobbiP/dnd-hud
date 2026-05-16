import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as dotenv from 'dotenv'
import { WebSocketServer } from 'ws'
import type { IncomingMessage } from 'http'
import { charactersRouter } from './routes/characters.js'
import { sessionRouter } from './routes/session.js'
import { itemsRouter } from './routes/items.js'
import { mobsRouter } from './routes/mobs.js'
import { floorPlansRouter } from './routes/floor-plans.js'
import { handleWsConnection } from './ws/handler.js'

dotenv.config()

const app = new Hono()
app.use('/*', cors())
app.route('/api/characters', charactersRouter)
app.route('/api/session', sessionRouter)
app.route('/api/items', itemsRouter)
app.route('/api/mobs', mobsRouter)
app.route('/api/floor-plans', floorPlansRouter)
// ── GM PIN auth ──────────────────────────────────────────────
// PIN is set via GM_PIN env var. Defaults to '1234' if not set.
// Clients send a guess; server returns ok: true/false.
// Rate limited: 5 wrong attempts per IP per 60 seconds.
const GM_PIN = process.env.GM_PIN ?? '1234'
const attempts = new Map<string, { count: number; resetAt: number }>()

app.post('/api/auth/verify-pin', async (c) => {
  const ip = c.req.header('x-forwarded-for') ?? 'local'
  const now = Date.now()

  // Rate limit check
  const record = attempts.get(ip)
  if (record && record.resetAt > now && record.count >= 5) {
    return c.json({ ok: false, error: 'Too many attempts. Wait 60 seconds.' }, 429)
  }
  if (!record || record.resetAt <= now) {
    attempts.set(ip, { count: 0, resetAt: now + 60_000 })
  }

  const { pin } = await c.req.json()
  if (pin === GM_PIN) {
    attempts.delete(ip)
    return c.json({ ok: true })
  }

  const rec = attempts.get(ip)!
  rec.count++
  return c.json({ ok: false, remaining: 5 - rec.count })
})

app.get('/', (c) => c.text('The HUD server is running.'))

const port = Number(process.env.PORT ?? 3001)

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`[HUD] HTTP server on http://localhost:${port}`)
})

// Attach a plain ws WebSocketServer to the same HTTP server
// Filter to /ws path so Hono REST routes aren't affected
const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req: IncomingMessage, socket, head) => {
  if (req.url === '/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  } else {
    socket.destroy()
  }
})

wss.on('connection', (ws) => {
  handleWsConnection(ws)
})

console.log(`[HUD] WebSocket ready on ws://localhost:${port}/ws`)
