import { WebSocket } from 'ws'
import type { IncomingMessage } from 'http'
import type { WSMessage } from '../types/index.js'
import { addClient, removeClient, broadcast, registerRole, sendToRole, sendToGM } from './broadcast.js'
import { getFullState, applyMessage } from '../db/state.js'

const SANDBOX_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000'

export function handleWsConnection(ws: WebSocket, req?: IncomingMessage) {
  const url = new URL(req?.url ?? '', 'http://localhost')
  const campaignId = url.searchParams.get('campaignId') || SANDBOX_CAMPAIGN_ID

  addClient(ws, campaignId)

  // Send full state immediately on connect scoped to campaignId
  getFullState(campaignId)
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

      // Direct message — route to specific recipient only within the campaign
      if (message.type === 'direct_message') {
        const { toCharId } = message
        if (toCharId === 'gm') {
          sendToGM(message, campaignId)
        } else if (toCharId === 'all') {
          broadcast(message, undefined, campaignId)
        } else {
          sendToRole(`player:${toCharId}`, message, campaignId)
        }
        return
      }

      // Full state sync request — re-send state to requesting client only
      if ((message as any).type === 'full_state_sync_request') {
        const state = await getFullState(campaignId)
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'full_state_sync', state }))
        }
        // Also broadcast to all campaign clients so everyone sees the new character
        broadcast({ type: 'full_state_sync', state } as any, undefined, campaignId)
        return
      }

      await applyMessage(message, campaignId)

      if (
        message.type === 'loot_opened' || 
        message.type === 'bone_harvest_trigger' || 
        message.type === 'display_room_enter' || 
        message.type === 'floor_update'
      ) {
        const freshState = await getFullState(campaignId)
        broadcast({ type: 'full_state_sync', state: freshState } as any, undefined, campaignId)

        if (message.type === 'bone_harvest_trigger') {
          broadcast({ 
            type: 'system_alert', 
            text: "THE BONE COLLECTOR ROARS! THE BONES OF YOUR VICTIMS SHIVER AND RISE TO ENCIRCLE YOU!" 
          }, undefined, campaignId)
        }
      } else {
        broadcast(message, ws, campaignId)
      }

      // After a session_reset, broadcast a full_state_sync so all clients get the
      // authoritative DB state (avoids optimistic drift on non-GM clients)
      if (message.type === 'session_reset') {
        const freshState = await getFullState(campaignId)
        broadcast({ type: 'full_state_sync', state: freshState } as any, undefined, campaignId)
      }
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
