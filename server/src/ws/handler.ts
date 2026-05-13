import { WebSocket } from 'ws'
import type { WSMessage } from '../types/index.js'
import { addClient, removeClient, broadcast } from './broadcast.js'
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
