import { useEffect, useRef, useCallback, useState } from 'react'
import type { WSMessage, AppState } from '../types'

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
const RECONNECT_MS = 2000

export function useWebSocket(onAnnouncement?: (label: string, text: string) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const [state, setState] = useState<AppState | null>(null)
  const [connected, setConnected] = useState(false)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const announcementRef = useRef(onAnnouncement)
  announcementRef.current = onAnnouncement

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => { setConnected(true); console.log('[WS] Connected') }

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as WSMessage
        if (msg.type === 'full_state_sync') { setState(msg.state); return }
        if (msg.type === 'pong') return
        if (msg.type === 'announcement') { announcementRef.current?.(msg.label, msg.text) }
        setState(prev => prev ? applyPatch(prev, msg) : prev)
      } catch (err) { console.error('[WS] Parse error:', err) }
    }

    ws.onclose = () => {
      setConnected(false)
      console.log('[WS] Disconnected — reconnecting')
      reconnectTimer.current = setTimeout(connect, RECONNECT_MS)
    }

    ws.onerror = () => ws.close()
  }, [])

  useEffect(() => {
    connect()
    return () => { wsRef.current?.close(); if (reconnectTimer.current) clearTimeout(reconnectTimer.current) }
  }, [connect])

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
      return {
        ...state,
        characters: state.characters.map(c => c.id === msg.charId
          ? { ...c, isAlive: false, viewerCount: c.viewerCount + Math.floor(Math.random() * 1500 + 500) }
          : c
        )
      }
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
    case 'announcement':
      return { ...state, gmLog: [`[${msg.label}] ${msg.text}`, ...state.gmLog].slice(0, 20) }
    default:
      return state
  }
}
