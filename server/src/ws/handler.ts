import { WebSocket } from 'ws'
import type { WSMessage } from '../types/index.js'
import { addClient, removeClient, broadcast, registerRole, sendToRole, sendToGM } from './broadcast.js'
import { getFullState, applyMessage } from '../db/state.js'

export function handleWsConnection(ws: WebSocket) {
  addClient(ws)

  // Send full state immediately on connect
  getFullState()
    .then((state) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'full_state_sync', state }))
      }
    })
    .catch((err) => console.error('[WS] Failed to send full state:', err))

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString()) as WSMessage

      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }))
        return
      }

      // Client registering its role — store in map, don't broadcast
      if (message.type === 'register') {
        registerRole(ws, message.role)
        return
      }

      // Direct message — route to specific recipient only (don't broadcast to all)
      if (message.type === 'direct_message') {
        const { toCharId } = message
        if (toCharId === 'gm') {
          sendToGM(message)
        } else {
          sendToRole(`player:${toCharId}`, message)
        }
        return
      }

      // Full state sync request — re-send state to requesting client only
      if ((message as any).type === 'full_state_sync_request') {
        const state = await getFullState()
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'full_state_sync', state }))
        }
        // Also broadcast to all so everyone sees the new character
        broadcast({ type: 'full_state_sync', state } as any, undefined)
        return
      }

      await applyMessage(message)
      broadcast(message, ws)
    } catch (err) {
      console.error('[WS] Message error:', err)
    }
  })

  ws.on('close', () => {
    removeClient(ws)
  })

  ws.on('error', (err) => {
    console.error('[WS] Socket error:', err)
    removeClient(ws)
  })
}
