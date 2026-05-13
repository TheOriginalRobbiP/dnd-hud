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
import { handleWsConnection } from './ws/handler.js'

dotenv.config()

const app = new Hono()
app.use('/*', cors())
app.route('/api/characters', charactersRouter)
app.route('/api/session', sessionRouter)
app.route('/api/items', itemsRouter)
app.route('/api/mobs', mobsRouter)
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
