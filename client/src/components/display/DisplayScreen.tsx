import { useState, useEffect, useRef } from 'react'
import type { WSMessage, AppState } from '../../types'

// ── Types ─────────────────────────────────────────────────────
interface RoomData {
  roomId: string
  roomName: string
  flavourArt: string | null
  roomTarget: number
  theme: string
  themeColour: string
}

interface TimerState {
  active: boolean
  seconds: number | null
  startedAt: number | null
}

// ── WebSocket (inline — display role doesn't need applyPatch state) ──
const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
const RECONNECT_MS = 2000

// ── Component ─────────────────────────────────────────────────
export function DisplayScreen() {
  const [room, setRoom] = useState<RoomData | null>(null)
  const [timer, setTimer] = useState<TimerState>({ active: false, seconds: null, startedAt: null })
  const [connected, setConnected] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  // ── WebSocket connection ──────────────────────────────────
  useEffect(() => {
    let destroyed = false

    function connect() {
      if (destroyed) return
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (destroyed) { ws.close(); return }
        setConnected(true)
        ws.send(JSON.stringify({ type: 'register', role: 'display' }))
      }

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data) as WSMessage
          switch (msg.type) {
            case 'display_room_enter':
              setRoom({
                roomId: msg.roomId,
                roomName: msg.roomName,
                flavourArt: msg.flavourArt,
                roomTarget: msg.roomTarget,
                theme: msg.theme,
                themeColour: msg.themeColour,
              })
              break
            case 'display_clear':
              setRoom(null)
              break
            case 'collapse_timer_start':
              setTimer({ active: true, seconds: msg.seconds, startedAt: Date.now() })
              break
            case 'collapse_timer_stop':
              setTimer({ active: false, seconds: null, startedAt: null })
              setCountdown(null)
              break
            case 'full_state_sync': {
              const state = (msg as { type: 'full_state_sync'; state: AppState }).state
              const floor = state.floor
              setSessionActive(floor.sessionActive ?? false)
              setTimer({
                active: floor.collapseTimerActive,
                seconds: floor.collapseTimerSeconds,
                startedAt: floor.collapseTimerStartedAt,
              })
              // Restore current room if one is active
              const rd = (floor as any).currentRoomData
              if (rd) {
                setRoom({
                  roomId: rd.roomId,
                  roomName: rd.roomName,
                  flavourArt: rd.flavourArt,
                  roomTarget: rd.roomTarget,
                  theme: rd.theme,
                  themeColour: rd.themeColour,
                })
              } else {
                setRoom(null)
              }
              break
            }
            case 'room_target_update':
              setRoom(prev => prev ? { ...prev, roomTarget: msg.target } : prev)
              break
            case 'session_start':
              setSessionActive(true)
              break
            case 'session_stop':
              setSessionActive(false)
              setRoom(null)
              break
          }
        } catch (err) {
          console.error('[DisplayScreen WS] Parse error:', err)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (!destroyed) setTimeout(connect, RECONNECT_MS)
      }

      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      destroyed = true
      wsRef.current?.close()
    }
  }, [])

  // ── Countdown tick ────────────────────────────────────────
  useEffect(() => {
    if (!timer.active || timer.seconds == null || timer.startedAt == null) {
      setCountdown(null)
      return
    }
    function tick() {
      if (timer.startedAt == null || timer.seconds == null) return
      const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000)
      const remaining = Math.max(0, timer.seconds - elapsed)
      setCountdown(remaining)
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [timer])

  // ── Helpers ───────────────────────────────────────────────
  function formatCountdown(secs: number): string {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const timerCritical = countdown !== null && countdown < 30

  // ── Render ────────────────────────────────────────────────
  if (!sessionActive) {
    return (
      <div className="h-screen w-screen bg-hud-bg flex flex-col items-center justify-center gap-6">
        <div className="font-hud text-hud-accent text-4xl tracking-widest animate-pulse">THE HUD</div>
        <div className="font-hud text-hud-muted text-sm tracking-wider">DUNGEON CRAWLER CARL — COMPANION SYSTEM</div>
        <div className="font-hud text-hud-muted text-xs opacity-50 mt-8 tracking-widest animate-pulse">AWAITING SESSION START</div>
      </div>
    )
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-hud-bg flex flex-col"
      style={room ? { '--theme-colour': room.themeColour } as React.CSSProperties : undefined}
    >
      {/* Theme colour tint overlay */}
      {room && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{ backgroundColor: room.themeColour, opacity: 0.06 }}
        />
      )}

      {/* Flavour art background */}
      {room?.flavourArt && (
        <>
          <img
            src={room.flavourArt}
            alt=""
            className="absolute inset-0 w-full h-full z-0"
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
          />
          <div className="absolute inset-0 bg-hud-bg z-0" style={{ opacity: 0.55 }} />
        </>
      )}

      {/* Connection badge */}
      <div className={`absolute top-2 right-2 text-xs px-2 py-1 font-hud z-50 ${
        connected
          ? 'bg-green-950 text-green-400 border border-green-900'
          : 'bg-red-950 text-red-400 border border-red-900 animate-pulse'
      }`}>
        {connected ? '● ONLINE' : '● RECONNECTING'}
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full w-full">
        {room ? (
          <>
            {/* Top-left: theme name */}
            <div className="p-6">
              <span className="font-hud text-xs text-hud-muted tracking-widest uppercase">
                {room.theme}
              </span>
            </div>

            {/* Centre: room name */}
            <div className="flex-1 flex items-center justify-center px-8">
              <h1 className="text-6xl font-hud text-hud-accent tracking-widest text-center uppercase">
                {room.roomName}
              </h1>
            </div>

            {/* Bottom row: target + timer */}
            <div className="p-6 flex items-end justify-between">
              {/* Collapse timer — bottom-centre */}
              <div className="flex-1 flex justify-center">
                {timer.active && countdown !== null && (
                  <div className={`font-hud text-3xl tracking-widest ${
                    timerCritical ? 'text-red-400 animate-pulse' : 'text-hud-text'
                  }`}>
                    COLLAPSE: {formatCountdown(countdown)}
                  </div>
                )}
              </div>

              {/* Target — bottom-right */}
              <div className="font-hud text-xs text-hud-muted tracking-widest text-right">
                TARGET: {room.roomTarget}
              </div>
            </div>
          </>
        ) : (
          /* Idle state */
          <div className="h-screen flex items-center justify-center flex-col gap-4 animate-pulse">
            <span className="font-hud text-hud-muted text-5xl tracking-widest">
              AWAITING SESSION START
            </span>
            <span className="font-hud text-sm text-hud-muted tracking-widest">
              STAND BY FOR SESSION INITIALISATION
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
