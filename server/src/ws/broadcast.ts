import { WebSocket } from 'ws'
import type { WSMessage, UserRole } from '../types/index.js'

const clients = new Set<WebSocket>()

// Track which role each socket has registered as
const roleMap = new Map<WebSocket, UserRole>()

export function addClient(ws: WebSocket) {
  clients.add(ws)
  console.log(`[WS] Client connected. Total: ${clients.size}`)
}

export function removeClient(ws: WebSocket) {
  clients.delete(ws)
  roleMap.delete(ws)
  console.log(`[WS] Client disconnected. Total: ${clients.size}`)
}

export function registerRole(ws: WebSocket, role: UserRole) {
  roleMap.set(ws, role)
  console.log(`[WS] Registered: ${role}`)
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

// Send to a specific role only (gm or player:<charId>)
export function sendToRole(role: UserRole, message: WSMessage) {
  const payload = JSON.stringify(message)
  for (const [ws, r] of roleMap.entries()) {
    if (r === role && ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
    }
  }
}

// Send to GM only
export function sendToGM(message: WSMessage) {
  sendToRole('gm', message)
}
