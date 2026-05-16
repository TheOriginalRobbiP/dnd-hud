import { useEffect, useRef, useCallback, useState } from 'react'
import type { WSMessage, AppState, UserRole } from '../types'

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
const RECONNECT_MS = 2000

export interface DirectMessage {
  fromCharId: string | 'gm'
  fromName: string
  text: string
  timestamp: number
  read: boolean
}

interface UseWebSocketOptions {
  role?: UserRole
  onAnnouncement?: (label: string, text: string) => void
  onDirectMessage?: (dm: DirectMessage) => void
}

export function useWebSocket({ role, onAnnouncement, onDirectMessage }: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null)
  const [state, setState] = useState<AppState | null>(null)
  const [connected, setConnected] = useState(false)
  const announcementRef = useRef(onAnnouncement)
  const dmRef = useRef(onDirectMessage)
  const roleRef = useRef(role)
  announcementRef.current = onAnnouncement
  dmRef.current = onDirectMessage
  roleRef.current = role

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      if (roleRef.current) {
        ws.send(JSON.stringify({ type: 'register', role: roleRef.current }))
      }
    }

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as WSMessage
        if (msg.type === 'full_state_sync') { setState(msg.state); return }
        if (msg.type === 'pong') return
        if (msg.type === 'announcement') { announcementRef.current?.(msg.label, msg.text) }
        if (msg.type === 'direct_message') {
          dmRef.current?.({ ...msg, read: false })
          return
        }
        setState(prev => prev ? applyPatch(prev, msg) : prev)
      } catch (err) { console.error('[WS] Parse error:', err) }
    }

    ws.onclose = () => {
      setConnected(false)
      setTimeout(connect, RECONNECT_MS)
    }

    ws.onerror = () => ws.close()
  }, [])

  useEffect(() => {
    connect()
    return () => { wsRef.current?.close() }
  }, [connect])

  useEffect(() => {
    if (role && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'register', role }))
    }
  }, [role])

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
      setState(prev => prev ? applyPatch(prev, msg) : prev)
    }
  }, [])

  return { state, connected, send }
}

function applyPatch(state: AppState, msg: WSMessage): AppState {
  switch (msg.type) {
    case 'hp_update':
      return { ...state, characters: state.characters.map(c => c.id === msg.charId ? { ...c, hp: msg.hp } : c) }
    case 'mp_update':
      return { ...state, characters: state.characters.map(c => c.id === msg.charId ? { ...c, mp: msg.mp } : c) }
    case 'viewer_update':
      return { ...state, characters: state.characters.map(c => c.id === msg.charId ? { ...c, viewerCount: msg.viewerCount } : c) }
    case 'death':
      return { ...state, characters: state.characters.map(c => c.id === msg.charId ? { ...c, isAlive: false, viewerCount: c.viewerCount + Math.floor(Math.random() * 1500 + 500) } : c) }
    case 'revive':
      return { ...state, characters: state.characters.map(c => c.id === msg.charId ? { ...c, isAlive: true, hp: msg.hp } : c) }
    case 'room_target_update':
      return { ...state, floor: { ...state.floor, roomTarget: msg.target } }
    case 'floor_update':
      return { ...state, floor: { ...state.floor, ...msg.floor } }
    case 'collapse_timer_start':
      return { ...state, floor: { ...state.floor, collapseTimerSeconds: msg.seconds, collapseTimerActive: true, collapseTimerStartedAt: Date.now() } }
    case 'collapse_timer_stop':
      return { ...state, floor: { ...state.floor, collapseTimerSeconds: null, collapseTimerActive: false, collapseTimerStartedAt: null } }
    case 'loot_assign':
      return { ...state, lootQueue: [...state.lootQueue, msg.lootBox] }
    case 'loot_authorise':
      return { ...state, lootQueue: state.lootQueue.map(b => b.id === msg.lootBoxId ? { ...b, state: 'authorised' as const } : b) }
    case 'loot_opened':
      return { ...state, lootQueue: state.lootQueue.filter(b => b.id !== msg.lootBoxId) }
    case 'mob_add':
      return { ...state, floor: { ...state.floor, activeMobs: [...state.floor.activeMobs, msg.mob] } }
    case 'mob_remove':
      return { ...state, floor: { ...state.floor, activeMobs: state.floor.activeMobs.filter(m => m.id !== msg.mobId) } }
    case 'mob_hp_update':
      return { ...state, floor: { ...state.floor, activeMobs: state.floor.activeMobs.map(m => m.id === msg.mobId ? { ...m, hp: msg.hp } : m) } }
    case 'achievement_unlock':
      return { ...state, characters: state.characters.map(c => c.id === msg.charId ? { ...c, achievements: [...c.achievements, msg.achievement] } : c) }
    case 'use_item': {
      const updated = state.characters.map(c => {
        if (c.id !== msg.charId) return c
        const item = c.inventory.find((i: any) => i.id === msg.itemId) as any
        let newInv: any[]
        if (item?.charges != null && item.charges > 1) {
          newInv = c.inventory.map((i: any) => i.id === msg.itemId ? { ...i, charges: i.charges - 1 } : i)
        } else {
          newInv = c.inventory.filter((i: any) => i.id !== msg.itemId)
        }
        return {
          ...c,
          inventory: newInv,
          hp: msg.hpEffect ? Math.max(0, Math.min(c.maxHp, c.hp + msg.hpEffect)) : c.hp,
          mp: msg.mpEffect ? Math.max(0, Math.min(c.maxMp, c.mp + msg.mpEffect)) : c.mp,
        }
      })
      const logEntry = msg.hpEffect
        ? `[ITEM] ${msg.charId.slice(0,6)} used ${msg.itemName} — ${msg.hpEffect > 0 ? '+' : ''}${msg.hpEffect} HP`
        : msg.mpEffect
        ? `[ITEM] ${msg.charId.slice(0,6)} used ${msg.itemName} — ${msg.mpEffect > 0 ? '+' : ''}${msg.mpEffect} MP`
        : `[ITEM] ${msg.charId.slice(0,6)} used ${msg.itemName} — GM: apply effect`
      return { ...state, characters: updated, gmLog: [logEntry, ...state.gmLog].slice(0, 20) }
    }
    case 'announcement':
      return { ...state, gmLog: [`[${msg.label}] ${msg.text}`, ...state.gmLog].slice(0, 20) }
    case 'session_start':
      return { ...state, floor: { ...state.floor, sessionActive: true } }
    case 'session_stop':
      return { ...state, floor: { ...state.floor, sessionActive: false } }
    default:
      return state
  }
}
