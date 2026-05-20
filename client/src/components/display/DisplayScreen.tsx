import { useState, useEffect, useRef, useCallback } from 'react'
import type { WSMessage, AppState, Mob, Achievement } from '../../types'

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

interface FloorPlan {
  id: string
  name: string
  theme: string
  themeColour: string
  isActive: boolean
}

interface FloorRoom {
  id: string
  floorPlanId: string
  name: string
  description: string
  tags: string[] | string
  roomTarget: number
  flavourArt: string | null
  mobTemplateIds: string
  posX: number
  posY: number
  isCurrentRoom: boolean
  isVisited: boolean
}

interface RoomConnection {
  id: string
  floorPlanId: string
  fromRoomId: string
  toRoomId: string
  label: string
  isContingency: boolean
}

// ── WebSocket (inline) ────────────────────────────────────────
const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
const RECONNECT_MS = 2000

function normaliseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags as string[]
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean)
  return []
}

export function DisplayScreen() {
  const [room, setRoom] = useState<RoomData | null>(null)
  const [timer, setTimer] = useState<TimerState>({ active: false, seconds: null, startedAt: null })
  const [connected, setConnected] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  
  // Custom HUD states for visual overhaul
  const [activePlan, setActivePlan] = useState<FloorPlan | null>(null)
  const [rooms, setRooms] = useState<FloorRoom[]>([])
  const [connections, setConnections] = useState<RoomConnection[]>([])
  const [activeMobs, setActiveMobs] = useState<Mob[]>([])
  const [gmLog, setGmLog] = useState<string[]>([])
  const [characters, setCharacters] = useState<any[]>([])
  const [achievementUnlock, setAchievementUnlock] = useState<{ characterName: string; achievement: Achievement } | null>(null)
  const [showRoomTarget, setShowRoomTarget] = useState(true)
  
  const wsRef = useRef<WebSocket | null>(null)
  const charactersRef = useRef<any[]>([])
  charactersRef.current = characters

  // ── Load Floor Plan detail from API ──────────────────────────
  const loadPlansAndDetails = useCallback(async () => {
    try {
      const plansList: FloorPlan[] = await fetch('/api/floor-plans').then(r => r.json())
      const active = plansList.find(p => p.isActive)
      if (active) {
        setActivePlan(active)
        const detail = await fetch(`/api/floor-plans/${active.id}`).then(r => r.json()) as {
          rooms: FloorRoom[]
          connections: RoomConnection[]
        }
        setRooms(detail.rooms || [])
        setConnections(detail.connections || [])
      } else {
        setActivePlan(null)
        setRooms([])
        setConnections([])
      }
    } catch (err) {
      console.error('[DisplayScreen API] Failed to load floor plans/details:', err)
    }
  }, [])

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
              loadPlansAndDetails()
              break
            case 'display_clear':
              setRoom(null)
              loadPlansAndDetails()
              break
            case 'play_sound': {
              const audio = new Audio(`/audio/${msg.soundId}.mp3`)
              audio.volume = 0.85
              audio.play().catch(() => {/* autoplay blocked */})
              break
            }
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
              setActiveMobs(floor.activeMobs || [])
              setGmLog(state.gmLog || [])
              setCharacters(state.characters || [])
              if (floor.showRoomTarget !== undefined) {
                setShowRoomTarget(floor.showRoomTarget)
              }
              
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
              loadPlansAndDetails()
              break
            }
            case 'floor_update':
              if (msg.floor.showRoomTarget !== undefined) {
                setShowRoomTarget(msg.floor.showRoomTarget)
              }
              break;
            case 'room_target_update':
              setRoom(prev => prev ? { ...prev, roomTarget: msg.target } : prev)
              break
            case 'session_start':
              setSessionActive(true)
              loadPlansAndDetails()
              break
            case 'session_stop':
              setSessionActive(false)
              setRoom(null)
              setRooms([])
              setConnections([])
              setActiveMobs([])
              break
            case 'mob_add':
              setActiveMobs(prev => [...prev, msg.mob])
              break
            case 'mob_remove':
              setActiveMobs(prev => prev.filter(m => m.id !== msg.mobId))
              break
            case 'mob_hp_update':
              setActiveMobs(prev => prev.map(m => m.id === msg.mobId ? { ...m, hp: msg.hp } : m))
              break
            case 'announcement':
              setGmLog(prev => [`[${msg.label}] ${msg.text}`, ...prev].slice(0, 20))
              break
            case 'achievement_unlock': {
              const char = charactersRef.current.find(c => c.id === msg.charId)
              const charName = char ? char.crawlerName : 'A crawler'
              setAchievementUnlock({
                characterName: charName,
                achievement: msg.achievement
              })
              break
            }
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
  }, [loadPlansAndDetails])

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

  // ── Auto-hide achievement popup after 7s ──────────────────
  useEffect(() => {
    if (achievementUnlock) {
      const id = setTimeout(() => {
        setAchievementUnlock(null)
      }, 7000)
      return () => clearTimeout(id)
    }
  }, [achievementUnlock])

  // ── Coordinate scaling for SVG Map ────────────────────────
  const scaledCoords = rooms.length > 0 ? (() => {
    let minX = Math.min(...rooms.map(r => r.posX))
    let maxX = Math.max(...rooms.map(r => r.posX))
    let minY = Math.min(...rooms.map(r => r.posY))
    let maxY = Math.max(...rooms.map(r => r.posY))
    
    if (maxX === minX) { minX -= 100; maxX += 100; }
    if (maxY === minY) { minY -= 100; maxY += 100; }
    
    const paddingX = (maxX - minX) * 0.18 || 50
    const paddingY = (maxY - minY) * 0.18 || 50
    minX -= paddingX
    maxX += paddingX
    minY -= paddingY
    maxY += paddingY
    
    const svgWidth = 1100
    const svgHeight = 440
    
    const coords: Record<string, { x: number; y: number }> = {}
    for (const r of rooms) {
      const x = ((r.posX - minX) / (maxX - minX)) * svgWidth
      const y = ((r.posY - minY) / (maxY - minY)) * svgHeight
      coords[r.id] = { x, y }
    }
    return coords
  })() : {}

  // ── Helpers ───────────────────────────────────────────────
  function formatCountdown(secs: number): string {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const timerCritical = countdown !== null && countdown < 120 // 2 minutes

  // ── Render ────────────────────────────────────────────────
  if (!sessionActive) {
    return (
      <div className="h-screen w-screen bg-hud-bg flex flex-col items-center justify-center gap-6">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; background-color: #09090b; color: #f4eee2; margin: 0; }
          .font-hud { font-family: 'JetBrains Mono', monospace; }
        `}</style>
        <div className="font-hud text-hud-accent text-5xl tracking-[0.2em] animate-pulse">THE HUD</div>
        <div className="font-hud text-hud-muted text-sm tracking-[0.15em] uppercase">DUNGEON CRAWLER CARL — COMPANION SYSTEM</div>
        <div className="font-hud text-hud-muted text-xs opacity-50 mt-12 tracking-[0.3em] animate-pulse">AWAITING SESSION START</div>
      </div>
    )
  }

  const currentRoom = rooms.find(r => r.isCurrentRoom)
  
  const getPublicDescription = (desc: string): string => {
    if (!desc) return ''
    const parts = desc.split(/(?:\n### |\nGM NOTES|\nGARRETT|\nMOBS|\nCENTAMINOTAURTAUR|\nNIMBUS|\nTHEY ALL CHOOSE)/i)
    return parts[0].trim()
  }

  const secretTags = ['trap', 'boss', 'hazard', 'puzzle', 'loot-room']
  const roomTags = currentRoom 
    ? normaliseTags(currentRoom.tags).filter(t => !secretTags.includes(t.toLowerCase()))
    : []

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-[#09090b] text-[#f4eee2] flex flex-col"
      style={room ? { '--theme-colour': room.themeColour } as React.CSSProperties : undefined}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .viewport-style {
          font-family: 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .viewport-style::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 3px,
            rgba(0, 0, 0, 0.04) 3px,
            rgba(0, 0, 0, 0.04) 4px
          );
        }

        .font-serif-dcc { font-family: 'Instrument Serif', Georgia, serif; }
        .font-mono-dcc { font-family: 'JetBrains Mono', monospace; }

        @keyframes alertPulse {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; text-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
        }
        .timer-critical {
          color: #ef4444;
          animation: alertPulse 1.5s ease-in-out infinite;
        }

        /* SVG Map Node Styles */
        .node-bg {
          fill: #101012;
          stroke: #1f1f23;
          stroke-width: 2px;
          transition: all 0.3s ease;
        }
        .node-visited .node-bg {
          fill: rgba(16, 185, 129, 0.03);
          stroke: #10b981;
          stroke-width: 2px;
        }
        .node-current .node-bg {
          fill: rgba(245, 158, 11, 0.05);
          stroke: #f59e0b;
          stroke-width: 3px;
          filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.2));
        }
        .node-fow .node-bg {
          stroke: #27272a;
          stroke-dasharray: 6,4;
          opacity: 0.35;
        }

        .node-glow {
          fill: none;
          stroke: #f59e0b;
          stroke-width: 6px;
          opacity: 0;
          transition: all 0.3s ease;
        }
        .node-current .node-glow {
          animation: pulseGlow 2s infinite;
        }
        @keyframes pulseGlow {
          0% { stroke-width: 4px; opacity: 0.15; }
          50% { stroke-width: 12px; opacity: 0.45; }
          100% { stroke-width: 4px; opacity: 0.15; }
        }

        /* Marquee ticker animation */
        @keyframes tickerMarquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .ticker-strip {
          display: flex;
          gap: 100px;
          white-space: nowrap;
          position: absolute;
          animation: tickerMarquee 45s linear infinite;
        }

        /* Achievements tier frame glow */
        .achievement-card {
          width: 800px;
          background: #121214;
          border: 2px solid #1f1f23;
          border-radius: 4px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .achievement-card.platinum   { border-color: #3b82f6; box-shadow: 0 0 50px rgba(59, 130, 246, 0.2); }
        .achievement-card.gold       { border-color: #f59e0b; box-shadow: 0 0 50px rgba(245, 158, 11, 0.2); }
        .achievement-card.celestial  { border-color: #a855f7; box-shadow: 0 0 50px rgba(168, 85, 247, 0.2); }
        .achievement-card.bronze     { border-color: #cd7f32; box-shadow: 0 0 50px rgba(205, 127, 50, 0.2); }
        .achievement-card.silver     { border-color: #94a3b8; box-shadow: 0 0 50px rgba(148, 163, 184, 0.2); }
      `}</style>

      {/* Theme colour tint overlay */}
      {room && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{ backgroundColor: room.themeColour, opacity: 0.05 }}
        />
      )}

      {/* Flavour art background image */}
      {room?.flavourArt && (
        <>
          <img
            src={room.flavourArt}
            alt=""
            className="absolute inset-0 w-full h-full z-0 opacity-40"
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
          />
          <div className="absolute inset-0 bg-[#09090b] z-0 opacity-50" />
        </>
      )}

      {/* Connection / Connection state badge */}
      <div className={`absolute top-4 right-4 text-[10px] tracking-widest font-mono-dcc px-2.5 py-1 z-50 ${
        connected
          ? 'bg-green-950/80 text-green-400 border border-green-900/60'
          : 'bg-red-950/80 text-red-400 border border-red-900/60 animate-pulse'
      }`}>
        {connected ? '● SYSTEM SYNCD' : '● RECONNECTING'}
      </div>

      <div className="relative z-10 flex flex-col h-full w-full viewport-style">
        
        {/* ── HEADER ── */}
        <header className="h-[85px] bg-[#121214]/90 border-b border-[#1f1f23] flex items-center justify-between px-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-mono-dcc text-[10px] font-bold text-[#10b981] border border-[#10b981]/25 bg-[#10b981]/5 px-3 py-1 rounded-[2px] tracking-widest">
              ● SYSTEM STABLE
            </span>
            <h2 className="font-mono-dcc text-lg font-bold tracking-widest text-[#f4eee2] uppercase">
              <span className="text-[#71717a] font-normal mr-2">FLOOR {timer.active ? '1' : activePlan?.name.split(' ')[1] || '1'} —</span> 
              {activePlan?.name.toUpperCase() || 'THE COMMONS'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono-dcc text-xs text-[#71717a] tracking-[0.2em]">COLLAPSE TIMER:</span>
            {timer.active && countdown !== null ? (
              <span className={`font-mono-dcc text-2xl font-bold ${timerCritical ? 'timer-critical' : 'text-[#f4eee2]'}`}>
                ⏱ {formatCountdown(countdown)}
              </span>
            ) : (
              <span className="font-mono-dcc text-2xl font-bold text-[#71717a]">⏱ --:--</span>
            )}
          </div>
        </header>

        {/* ── MAIN TWO-COLUMN SPLIT GRID ── */}
        <main className="flex-1 grid grid-cols-[66%_34%] min-h-0">
          
          {/* LEFT AREA: Live FOW Map & Room telemetries */}
          <section className="flex flex-col border-r border-[#1f1f23] p-8 gap-6 min-h-0">
            
            {/* Live SVG Node Map Container */}
            <div className="flex-1 bg-[#121214]/40 border border-[#1f1f23] rounded-[4px] relative overflow-hidden min-h-0">
              {/* grid pattern bg */}
              <div 
                className="absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundSize: '40px 40px',
                  backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)'
                }}
              />
              <div className="absolute top-4 left-5 font-mono-dcc text-[9px] font-bold tracking-[0.25em] text-[#71717a] uppercase">
                {activePlan ? `${activePlan.name.toUpperCase()} — TACTICAL TELEMETRY (FOW)` : 'TACTICAL TELEMETRY MAP'}
              </div>
              
              {rooms.length > 0 ? (
                <svg className="w-full h-full relative z-10 p-12" viewBox="0 0 1100 440">
                  {/* Edges/Paths */}
                  {connections.map(c => {
                    const fromCoords = scaledCoords[c.fromRoomId]
                    const toCoords = scaledCoords[c.toRoomId]
                    if (!fromCoords || !toCoords) return null
                    
                    const fromRoom = rooms.find(r => r.id === c.fromRoomId)
                    const toRoom = rooms.find(r => r.id === c.toRoomId)
                    const isExplored = (fromRoom?.isVisited || fromRoom?.isCurrentRoom) && (toRoom?.isVisited || toRoom?.isCurrentRoom)
                    const isFow = !isExplored && !(fromRoom?.isVisited || fromRoom?.isCurrentRoom) && !(toRoom?.isVisited || toRoom?.isCurrentRoom)
                    
                    return (
                      <line
                        key={c.id}
                        x1={fromCoords.x}
                        y1={fromCoords.y}
                        x2={toCoords.x}
                        y2={toCoords.y}
                        stroke={isExplored ? '#10b981' : isFow ? '#1e1f24' : '#1f1f23'}
                        strokeWidth={isExplored ? '2px' : '1.5px'}
                        strokeDasharray={c.isContingency ? '5,5' : undefined}
                        opacity={isFow ? 0.2 : 1}
                        className="transition-all duration-300"
                      />
                    )
                  })}

                  {/* Room Nodes */}
                  {rooms.map(r => {
                    const coords = scaledCoords[r.id]
                    if (!coords) return null
                    
                    const isVisited = r.isVisited
                    const isCurrent = r.isCurrentRoom
                    const isFow = !isVisited && !isCurrent
                    
                    const classes = isCurrent ? 'node-current' : isVisited ? 'node-visited' : 'node-fow'
                    const dispName = isFow ? '?' : r.name.split(' — ')[1] || r.name.split(' \u2014 ')[1] || r.name
                    const shortName = dispName.length > 18 ? dispName.substring(0, 16) + '...' : dispName
                    
                    return (
                      <g key={r.id} transform={`translate(${coords.x}, ${coords.y})`} className={`${classes} transition-all duration-300`}>
                        <circle className="node-glow" r="38" />
                        <circle className="node-bg" r="38" />
                        <text
                          className="font-mono-dcc text-[10px] font-bold transition-all duration-300 fill-[#f4eee2]"
                          y="4"
                          textAnchor="middle"
                          opacity={isFow ? 0.35 : 1}
                        >
                          {shortName.toUpperCase()}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono-dcc text-sm text-[#71717a] italic">
                  No floor plan layout loaded.
                </div>
              )}
            </div>

            {/* Room Detail Overlay Card */}
            <div className="h-[220px] bg-[#121214] border border-[#1f1f23] rounded-[4px] p-6 flex gap-8 items-center flex-shrink-0 relative">
              {room ? (
                <>
                  <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <span className="font-mono-dcc text-[10px] font-bold tracking-[0.25em] text-[#f59e0b] uppercase">
                      CURRENT SECTOR DATA
                    </span>
                    <h1 className="font-serif-dcc text-[44px] font-normal text-[#f4eee2] leading-none uppercase tracking-wide truncate">
                      {room.roomName}
                    </h1>
                    {roomTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {roomTags.map(tag => (
                          <span key={tag} className="font-mono-dcc text-[8px] font-bold border border-[#f59e0b]/20 text-[#f59e0b] bg-[#f59e0b]/5 px-2 py-0.5 rounded-[2px] tracking-wider uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm line-clamp-3 text-[#71717a] leading-relaxed font-sans pr-4">
                      {currentRoom ? getPublicDescription(currentRoom.description) : 'No description found for this sector. Keep your alert telemetry open.'}
                    </p>
                  </div>
                  <div className="w-[180px] h-full border-l border-[#1f1f23] flex flex-col items-center justify-center gap-1 bg-white/[0.005] flex-shrink-0">
                    <span className="font-mono-dcc text-[9px] font-bold tracking-[0.25em] text-[#71717a] uppercase">
                      {showRoomTarget ? 'ROOM TARGET' : 'TARGET'}
                    </span>
                    <span className="font-serif-dcc text-[90px] font-normal text-[#f59e0b] leading-none" style={{ textShadow: '0 0 30px rgba(245, 158, 11, 0.25)' }}>
                      {showRoomTarget ? room.roomTarget : '🔒'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[#71717a] font-mono-dcc text-sm">
                  <span className="text-2xl mb-2">🧭</span>
                  AWAITING ROOM SECTOR ENTRY
                </div>
              )}
            </div>

          </section>

          {/* RIGHT AREA: Active Threats Encounter tracker */}
          <section className="flex flex-col p-8 gap-6 min-h-0">
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div className="font-mono-dcc text-xs font-bold tracking-[0.25em] text-[#71717a] uppercase border-b border-[#1f1f23] pb-3 flex justify-between items-center flex-shrink-0">
                <span>ACTIVE THREATS</span>
                <span className={activeMobs.length > 0 ? 'text-[#ef4444] font-bold' : 'text-[#10b981] font-bold'}>
                  {activeMobs.length > 0 ? `${activeMobs.length} DETECTED` : 'SECURE'}
                </span>
              </div>

              {activeMobs.length > 0 ? (
                <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
                  {activeMobs.map(mob => {
                    const hpPercent = Math.max(0, Math.min(100, (mob.hp / mob.maxHp) * 100))
                    const isElite = mob.notes.toLowerCase().includes('elite') || mob.maxHp >= 20
                    const isBoss = mob.notes.toLowerCase().includes('boss') || mob.maxHp >= 40
                    const tierLabel = isBoss ? 'BOSS' : isElite ? 'ELITE' : 'BASIC'
                    const badgeColour = isBoss 
                      ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                      : isElite 
                        ? 'bg-[#f59e0b]/10 border-[#f59e0b]/20 text-[#f59e0b]' 
                        : 'bg-zinc-800/50 border-zinc-700/50 text-[#71717a]'
                    
                    return (
                      <div 
                        key={mob.id} 
                        className={`bg-[#121214] border border-[#1f1f23] rounded-[4px] p-5 flex flex-col gap-3 transition-colors ${
                          isBoss ? 'border-l-[3px] border-l-[#ef4444]' : isElite ? 'border-l-[3px] border-l-[#f59e0b]' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center gap-3">
                          <span className={`font-mono-dcc text-sm font-bold tracking-wider uppercase ${isBoss ? 'text-[#ef4444]' : 'text-[#f4eee2]'}`}>
                            {mob.name}
                          </span>
                          <span className={`font-mono-dcc text-[8px] font-bold border px-1.5 py-0.5 tracking-widest uppercase rounded-[2px] ${badgeColour}`}>
                            {tierLabel}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between font-mono-dcc text-[9px] font-semibold tracking-wider text-[#71717a] uppercase">
                            <span>CON CHECK EFFORT</span>
                            <span className={`font-bold ${isBoss ? 'text-[#ef4444]' : 'text-[#f4eee2]'}`}>
                              {mob.hp} / {mob.maxHp} HP
                            </span>
                          </div>
                          <div className="h-[8px] bg-white/[0.04] border border-white/[0.02] rounded-[1px] overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-red-900 to-red-500 transition-all duration-300 rounded-[1px]" 
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                        </div>
                        {mob.notes && (
                          <div className="text-xs leading-relaxed text-[#71717a] font-sans pt-2 border-t border-white/[0.02]">
                            <span className="font-mono-dcc text-[#f59e0b] font-bold mr-1">SPECIAL:</span>
                            {mob.notes}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 border border-dashed border-[#1f1f23] bg-[#121214]/20 rounded-[4px] text-[#71717a] p-8 text-center">
                  <span className="text-3xl opacity-50">🛡️</span>
                  <h3 className="font-mono-dcc text-[10px] font-bold tracking-[0.25em] text-[#71717a] uppercase">
                    SECURE SECTOR
                  </h3>
                  <p className="text-xs max-w-[240px] leading-relaxed font-sans opacity-70">
                    No active threats detected in this sector. Stand by for tactical update.
                  </p>
                </div>
              )}
            </div>
          </section>

        </main>

        {/* ── BOTTOM TICKER BAR ── */}
        <footer className="h-[50px] bg-[#121214] border-t border-[#1f1f23] flex items-center flex-shrink-0 overflow-hidden relative">
          <div className="font-mono-dcc text-[9px] font-bold tracking-[0.25em] text-[#f59e0b] px-6 border-r border-[#1f1f23] h-full flex items-center bg-white/[0.015] flex-shrink-0 z-20 uppercase">
            DUNGEON LOG FEED
          </div>
          <div className="flex-1 h-full overflow-hidden relative flex items-center z-10">
            {gmLog.length > 0 ? (
              <div className="ticker-strip">
                {gmLog.map((logStr, idx) => {
                  let dotBg = 'bg-[#71717a]'
                  if (logStr.toLowerCase().includes('dmg') || logStr.toLowerCase().includes('damage') || logStr.toLowerCase().includes('threat') || logStr.toLowerCase().includes('died')) {
                    dotBg = 'bg-[#ef4444]'
                  } else if (logStr.toLowerCase().includes('unlocked') || logStr.toLowerCase().includes('earned') || logStr.toLowerCase().includes('loot')) {
                    dotBg = 'bg-[#f59e0b]'
                  } else if (logStr.toLowerCase().includes('heal') || logStr.toLowerCase().includes('entered') || logStr.toLowerCase().includes('stable')) {
                    dotBg = 'bg-[#10b981]'
                  }
                  
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs text-[#71717a] font-sans">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotBg}`} />
                      <span>{logStr}</span>
                    </div>
                  )
                })}
                {/* duplicate list for continuous loop spacing */}
                {gmLog.map((logStr, idx) => {
                  let dotBg = 'bg-[#71717a]'
                  if (logStr.toLowerCase().includes('dmg') || logStr.toLowerCase().includes('damage') || logStr.toLowerCase().includes('threat') || logStr.toLowerCase().includes('died')) {
                    dotBg = 'bg-[#ef4444]'
                  } else if (logStr.toLowerCase().includes('unlocked') || logStr.toLowerCase().includes('earned') || logStr.toLowerCase().includes('loot')) {
                    dotBg = 'bg-[#f59e0b]'
                  } else if (logStr.toLowerCase().includes('heal') || logStr.toLowerCase().includes('entered') || logStr.toLowerCase().includes('stable')) {
                    dotBg = 'bg-[#10b981]'
                  }
                  
                  return (
                    <div key={`dup-${idx}`} className="flex items-center gap-3 text-xs text-[#71717a] font-sans">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotBg}`} />
                      <span>{logStr}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="pl-6 text-xs text-[#71717a] font-mono-dcc tracking-wider animate-pulse">
                Telemetry feed silent... system monitoring active.
              </div>
            )}
          </div>
        </footer>

        {/* ── FULL SCREEN ACHIEVEMENT OVERLAY POPUP ── */}
        <div className={`popup-overlay absolute inset-0 bg-[#050506]/95 backdrop-blur-[15px] z-[1000] flex items-center justify-center transition-all duration-500 ${
          achievementUnlock ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          {achievementUnlock && (
            <div className={`achievement-card p-0.5 rounded-[4px] ${achievementUnlock.achievement.tier || 'gold'} ${
              achievementUnlock ? 'scale-100 translate-y-0' : 'scale-90 -translate-y-[30px]'
            }`}>
              <div className="bg-[#121214] rounded-[2px] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1f1f23] flex items-center justify-between bg-white/[0.01]">
                  <span className="font-mono-dcc text-[9px] font-bold tracking-[0.3em] text-[#f59e0b] uppercase">
                    INTERGALACTIC RECORD SYNC
                  </span>
                  <span className={`font-mono-dcc text-[8px] font-bold px-3 py-1 tracking-widest rounded-[2px] uppercase ${
                    (achievementUnlock.achievement.tier as string) === 'platinum' 
                      ? 'bg-[#3b82f6] text-[#09090b]' 
                      : achievementUnlock.achievement.tier === 'celestial' 
                        ? 'bg-[#a855f7] text-[#09090b]' 
                        : achievementUnlock.achievement.tier === 'silver'
                          ? 'bg-[#94a3b8] text-[#09090b]'
                          : 'bg-[#f59e0b] text-[#09090b]'
                  }`}>
                    {(achievementUnlock.achievement.tier || 'GOLD').toUpperCase()} TIER
                  </span>
                </div>
                <div className="p-12 flex flex-col items-center text-center gap-6">
                  <div className="w-[100px] h-[100px] flex items-center justify-center text-4xl bg-white/[0.02] border border-[#1f1f23] rounded-full">
                    🏆
                  </div>
                  <h2 className="font-serif-dcc text-[44px] font-normal text-[#f4eee2] leading-tight tracking-wide">
                    {achievementUnlock.achievement.name}
                  </h2>
                  <p className="text-base text-[#71717a] max-w-[600px] leading-relaxed font-sans">
                    New Achievement awarded to <span className="text-[#f4eee2] font-semibold">{achievementUnlock.characterName}</span>: {achievementUnlock.achievement.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
