import { WebSocket } from 'ws'
import type { WSMessage, UserRole } from '../types/index.js'

const SANDBOX_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000'

const clients = new Set<WebSocket>()

// Track which campaign each socket belongs to
const campaignMap = new Map<WebSocket, string>()

// Track which role each socket has registered as
const roleMap = new Map<WebSocket, UserRole>()

export function addClient(ws: WebSocket, campaignId: string = SANDBOX_CAMPAIGN_ID) {
  clients.add(ws)
  campaignMap.set(ws, campaignId)
  console.log(`[WS] Client connected to campaign: ${campaignId}. Total: ${clients.size}`)
}

export function broadcastPresence(campaignId: string = SANDBOX_CAMPAIGN_ID) {
  const activeCharIds = new Set<string>()
  for (const [ws, role] of roleMap.entries()) {
    const wsCampaignId = campaignMap.get(ws) ?? SANDBOX_CAMPAIGN_ID
    if (wsCampaignId === campaignId && role.startsWith('player:')) {
      activeCharIds.add(role.replace('player:', ''))
    }
  }
  broadcast({ type: 'presence_sync', activeCharIds: Array.from(activeCharIds) }, undefined, campaignId)
}

export function removeClient(ws: WebSocket) {
  clients.delete(ws)
  const campaignId = campaignMap.get(ws) ?? SANDBOX_CAMPAIGN_ID
  campaignMap.delete(ws)
  const hadRole = roleMap.has(ws)
  roleMap.delete(ws)
  console.log(`[WS] Client disconnected. Total: ${clients.size}`)
  if (hadRole) {
    broadcastPresence(campaignId)
  }
}

export function registerRole(ws: WebSocket, role: UserRole) {
  roleMap.set(ws, role)
  const campaignId = campaignMap.get(ws) ?? SANDBOX_CAMPAIGN_ID
  console.log(`[WS] Registered: ${role} on campaign: ${campaignId}`)
  broadcastPresence(campaignId)
}

export function broadcast(message: WSMessage, exclude?: WebSocket, campaignId: string = SANDBOX_CAMPAIGN_ID) {
  const payload = JSON.stringify(message)
  for (const client of clients) {
    if (client === exclude) continue
    const clientCampaignId = campaignMap.get(client) ?? SANDBOX_CAMPAIGN_ID
    if (clientCampaignId !== campaignId) continue

    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  }
}

// Send to a specific role only (gm or player:<charId>) within a campaign
export function sendToRole(role: UserRole, message: WSMessage, campaignId: string = SANDBOX_CAMPAIGN_ID) {
  const payload = JSON.stringify(message)
  for (const [ws, r] of roleMap.entries()) {
    const wsCampaignId = campaignMap.get(ws) ?? SANDBOX_CAMPAIGN_ID
    if (wsCampaignId === campaignId && r === role && ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
    }
  }
}

// Send to GM only within a campaign
export function sendToGM(message: WSMessage, campaignId: string = SANDBOX_CAMPAIGN_ID) {
  sendToRole('gm', message, campaignId)
}
