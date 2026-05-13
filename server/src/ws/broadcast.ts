import { WebSocket } from 'ws'
import type { WSMessage } from '../types/index.js'

const clients = new Set<WebSocket>()

export function addClient(ws: WebSocket) {
  clients.add(ws)
  console.log(`[WS] Client connected. Total: ${clients.size}`)
}

export function removeClient(ws: WebSocket) {
  clients.delete(ws)
  console.log(`[WS] Client disconnected. Total: ${clients.size}`)
}

export function broadcast(message: WSMessage, exclude?: WebSocket) {
  const payload = JSON.stringify(message)
  for (const client of clients) {
    if (client === exclude) continue
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  }
}
