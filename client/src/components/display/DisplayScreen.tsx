import { useState, useEffect, useRef, useCallback } from 'react'
import type { WSMessage, AppState, Mob, Achievement } from '../../types'
import { Battlemap } from '../shared/Battlemap'

// ── Types ─────────────────────────────────────────────────────
interface RoomData {
  roomId: string
  roomName: string
  flavourArt: string | null
  sceneArt: string | null
  battlemapArt: string | null
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
  const [activeCharIds, setActiveCharIds] = useState<string[]>([])
  const [displayViewMode, setDisplayViewMode] = useState<string>('scene')
  const [systemAlert, setSystemAlert] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  
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
                sceneArt: msg.sceneArt,
                battlemapArt: msg.battlemapArt,
                roomTarget: msg.roomTarget,
                theme: msg.theme,
                themeColour: msg.themeColour,
              })
              setDisplayViewMode('scene') // Default to scene mode on entering a room!
              loadPlansAndDetails()
              break
            case 'display_view_mode_update':
              setDisplayViewMode(msg.mode)
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
                startedAt: floor.collapseTimerStartedAt ? new Date(floor.collapseTimerStartedAt).getTime() : null,
              })
              setActiveMobs(floor.activeMobs || [])
              setGmLog(state.gmLog || [])
              setCharacters(state.characters || [])
              if (floor.showRoomTarget !== undefined) {
                setShowRoomTarget(floor.showRoomTarget)
              }
              if (floor.displayViewMode !== undefined) {
                setDisplayViewMode(floor.displayViewMode)
              }
              
              const rd = (floor as any).currentRoomData
              if (rd) {
                setRoom({
                  roomId: rd.roomId,
                  roomName: rd.roomName,
                  flavourArt: rd.flavourArt,
                  sceneArt: rd.sceneArt ?? null,
                  battlemapArt: rd.battlemapArt ?? null,
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
            case 'token_move':
              if (msg.charId) {
                setCharacters(prev => prev.map(c => c.id === msg.charId ? { ...c, tokenPosX: msg.posX, tokenPosY: msg.posY } : c))
              } else if (msg.mobId) {
                setActiveMobs(prev => prev.map(m => m.id === msg.mobId ? { ...m, posX: msg.posX, posY: msg.posY } : m))
              }
              break
            case 'presence_sync':
              setActiveCharIds(msg.activeCharIds)
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
            case 'system_alert': {
              setSystemAlert(msg.text)
              setIsShaking(true)
              setTimeout(() => {
                setSystemAlert(null)
              }, 8500)
              setTimeout(() => {
                setIsShaking(false)
              }, 3000)
              
              // Autoplay standard dramatic alarm buzzer
              const audio = new Audio('/audio/alarm.mp3')
              audio.volume = 0.5
              audio.play().catch(() => {})
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
      className={`relative h-screen w-screen overflow-hidden bg-[#09090b] text-[#f4eee2] flex flex-col ${isShaking ? 'animate-shake' : ''}`}
      style={room ? { '--theme-colour': room.themeColour } as React.CSSProperties : undefined}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-10px, -5px); }
          20%, 40%, 60%, 80% { transform: translate(10px, 5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out infinite;
        }
        
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

      <div className="relative z-10 flex flex-col h-full w-full viewport-style">
        
        {/* ── HEADER ── */}
        <header className="h-[85px] bg-[#121214]/90 border-b border-[#1f1f23] flex items-center justify-between px-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-mono-dcc text-[10px] font-bold text-[#10b981] border border-[#10b981]/25 bg-[#10b981]/5 px-3 py-1 rounded-[2px] tracking-widest">
              ● SYSTEM STABLE
            </span>
            <span className={`font-mono-dcc text-[10px] font-bold px-2.5 py-1 rounded-[2px] border tracking-widest ${
              connected
                ? 'bg-green-950/40 text-green-400 border-green-900/30'
                : 'bg-red-950/40 text-red-400 border-red-900/30 animate-pulse'
            }`}>
              {connected ? '● SYNCED' : '● RECONNECTING'}
            </span>
            {room && (
              <span className="font-mono-dcc text-[10px] font-bold text-[#f59e0b] border border-[#f59e0b]/25 bg-[#f59e0b]/5 px-3 py-1 rounded-[2px] tracking-widest animate-pulse">
                TARGET: {showRoomTarget ? room.roomTarget : '🔒'}
              </span>
            )}
            <h2 className="font-mono-dcc text-lg font-bold tracking-widest text-[#f4eee2] uppercase">
              <span className="text-[#71717a] font-normal mr-2">FLOOR {timer.active ? '1' : activePlan?.name.split(' ')[1] || '1'} —</span> 
              {(activePlan?.name.replace(/Floor \d+\s*[—-]\s*/i, '') || 'THE COMMONS').toUpperCase()}
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

        {/* ── MAIN FULL-WIDTH VIEWPORT ── */}
        <main className="flex-1 p-6 flex flex-col min-h-0 relative">
          
          {/* Live SVG Node Map or Cinematic Battleboard Container */}
          <div className="flex-1 bg-[#121214]/40 border border-[#1f1f23] rounded-[4px] relative overflow-hidden min-h-0">
            {displayViewMode.startsWith('tutorial_') ? (
              <TutorialSlideshow viewMode={displayViewMode} />
            ) : room && (room.sceneArt || room.battlemapArt || room.flavourArt) ? (
              <>
                {/* Layer 1: Cinematic Narrative Scene Art */}
                <div 
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    displayViewMode === 'scene' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'
                  }`}
                >
                  {(room.sceneArt || room.flavourArt) && (
                    <img
                      src={room.sceneArt || room.flavourArt || undefined}
                      alt="Cinematic Scene"
                      className="w-full h-full object-cover opacity-90"
                    />
                  )}
                  {/* Shadow vignetting on top */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
                  <div className="absolute top-5 left-5 font-mono-dcc text-[10px] font-bold text-[#f59e0b] tracking-[0.25em] bg-black/80 px-3 py-1.5 border border-[#1f1f23] rounded uppercase z-20">
                    👁️ NARRATIVE TELEMETRY MODE
                  </div>
                </div>

                {/* Layer 2: Tactical 2D VTT Battlemap */}
                <div 
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    displayViewMode === 'battlemap' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
                  }`}
                >
                  {(room.battlemapArt || room.flavourArt) && (
                    <Battlemap
                      mapUrl={room.battlemapArt || room.flavourArt || null}
                      characters={characters}
                      activeMobs={activeMobs}
                      isEditable={false}
                      activeCharIds={activeCharIds}
                      onTokenMove={() => {}}
                    />
                  )}
                </div>

                {/* Floating Transparent HUD Card Overlay */}
                <div className="absolute bottom-5 left-5 z-20 max-w-[480px] bg-[#121214]/85 backdrop-blur-md border border-[#1f1f23] rounded p-5 shadow-2xl flex flex-col gap-2.5">
                  <span className="font-mono-dcc text-[9px] font-bold tracking-[0.25em] text-[#f59e0b] uppercase">
                    CURRENT SECTOR DATA
                  </span>
                  <h1 className="font-serif-dcc text-3xl font-normal text-[#f4eee2] leading-none uppercase tracking-wide">
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
                  <p className="text-xs text-[#71717a] leading-relaxed font-sans pr-2">
                    {currentRoom ? getPublicDescription(currentRoom.description) : 'No description found for this sector. Keep your alert telemetry open.'}
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* grid pattern bg */}
                <div 
                  className="absolute inset-0 opacity-[0.035]"
                  style={{
                    backgroundSize: '40px 40px',
                    backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)'
                  }}
                />
                <div className="absolute top-4 left-5 font-mono-dcc text-[9px] font-bold tracking-[0.25em] text-[#71717a] uppercase z-20">
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
              </>
            )}
          </div>
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

        {/* ── FULL SCREEN SYSTEM ALERT OVERLAY ── */}
        <div className={`popup-overlay absolute inset-0 bg-[#3b0712]/90 backdrop-blur-[15px] z-[1001] flex items-center justify-center transition-all duration-500 ${
          systemAlert ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          {systemAlert && (
            <div className="achievement-card p-0.5 rounded-[4px] border-red-600 bg-[#09090b] shadow-[0_0_80px_rgba(239,68,68,0.4)] scale-100 translate-y-0">
              <div className="bg-[#121214] rounded-[2px] overflow-hidden">
                <div className="px-6 py-4 border-b border-red-900 flex items-center justify-between bg-red-950/20">
                  <span className="font-mono-dcc text-[10px] font-bold tracking-[0.3em] text-red-500 uppercase animate-pulse">
                    ⚠️ SYSTEM INTRUSION ALERT
                  </span>
                  <span className="font-mono-dcc text-[8px] font-bold px-3 py-1 tracking-widest rounded-[2px] uppercase bg-red-600 text-white animate-pulse">
                    CRITICAL
                  </span>
                </div>
                <div className="p-12 flex flex-col items-center text-center gap-6">
                  <div className="w-[100px] h-[100px] flex items-center justify-center text-4xl bg-red-950/20 border border-red-800 rounded-full animate-bounce">
                    🚨
                  </div>
                  <h2 className="font-serif-dcc text-[44px] font-normal text-red-500 leading-tight tracking-wide animate-pulse uppercase">
                    BONE HARVEST TRIGGERED
                  </h2>
                  <p className="text-xl text-[#f4eee2] font-semibold max-w-[680px] leading-relaxed font-mono-dcc border border-red-900 p-4 bg-black/60 rounded">
                    {systemAlert}
                  </p>
                  <p className="text-xs text-red-400 font-mono-dcc opacity-60">
                    Sponsor Broadcast cameras locked. Show ratings spiking (+18.4%). Do not die.
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

const TUTORIAL_SLIDES = [
  {
    title: "WELCOME TO THE SURFACE",
    subtitle: "INDEX CARD RPG & DCC OVERVIEW",
    bullets: [
      "No massive rulebooks, no complex math. Just clean stats and rapid choices.",
      "THE MINDSET: Take what is useful, toss the rest. Keep the action fast and loose.",
      "CLOCKWISE TURNS: We play in turn order, always clockwise around the table.",
      "ONE TARGET: Every check, attack, or challenge rolls against a single number.",
      "EFFORT: You don't just succeed; you roll different dice to see how much work you get done."
    ],
    details: [
      "Why No Skills? In ICRPG, your six stats (STR, DEX, CON, INT, WIS, CHA) represent everything. Instead of checking a 'stealth' skill, you simply check your Dexterity.",
      "Skins & Theme: We are playing a custom Dungeon Crawler Carl (DCC) campaign. Modern ruined infrastructure, unhinged alien game shows, and comedic corporate sponsors."
    ],
    accent: "FIND PERFECTION IN THE IMPERFECT. WHEN NEED ARISES, CREATE RATHER THAN SEEK."
  },
  {
    title: "ACTION IN TURNS",
    subtitle: "DESCRIBE, ROLL, RESOLVE",
    bullets: [
      "THE SPOTLIGHT: When it is your turn, the scene becomes yours to change or explore.",
      "DESCRIBE IT: Tell the Game Master exactly what you want to attempt or search.",
      "ROLL THE BONES: Roll a D20 + your core Stat modifier.",
      "GET RESULTS: Meet or Beat the Room Target to succeed and change the story.",
      "GM TURN: The GM has a turn too—this is when hazards activate and monsters strike!"
    ],
    details: [
      "Initiative Roll: At the start of an encounter, everyone rolls a D20. The highest goes first, and we proceed clockwise from them.",
      "The Golden Rule: Never let your turn go to waste by overthinking. If you aren't sure, describe an intuitive or crazy action!"
    ],
    accent: "CLOCKWISE TURN ORDER KEEPS EVERYONE IN THE SPOTLIGHT!"
  },
  {
    title: "THREE KINDS OF TURNS",
    subtitle: "HOW TO USE YOUR SPOTLIGHT TIME",
    bullets: [
      "1. ACTION ONLY: You stay put. Cast a spell, attack a foe, or crack a terminal.",
      "2. MOVE NEAR + ACTION: Take a few steps to a nearby console/enemy, then act.",
      "3. MOVE FAR: Spend your entire turn running twice as far as normal. No action allowed.",
      "NEVER STALL: If you don't know what to do, ask details or take a risk!"
    ],
    details: [
      "Move Near is roughly 6 inches on a battlemap, or about 15-20 feet of narrative movement (roughly the length of a banana).",
      "Sprinting (Move Far) is perfect for closing massive gaps, diving behind cover, or escaping an impending area-of-effect blast."
    ],
    accent: "CHOOSE WISELY. TIME IS YOUR MOST PRECIOUS RESOURCE."
  },
  {
    title: "THREE KINDS OF ACTIONS",
    subtitle: "SIMPLE, CHECKS, AND ATTEMPTS",
    bullets: [
      "SIMPLE ACTIONS (Auto-Success): No roll needed. Flip a switch, start an engine, draw a sword.",
      "CHECKS (Instant Win/Fail): Roll D20 + Stat vs Target. Success is instantaneous (e.g. leap a gap, spot a trap).",
      "ATTEMPTS (Sustained Effort): Roll D20 + Stat to hit/succeed. If you pass, roll your EFFORT die to wear down the task or enemy."
    ],
    details: [
      "Sustained Attempts: Some tasks are too big for one roll. Cracking a locked blast door might require 1 Heart (10 points) of Effort. You roll to make progress each turn.",
      "Helpers: Multiple players can cooperate on an Attempt. Your combined effort rolls wear down the obstacle's Hearts."
    ],
    accent: "ROLL D20 + STAT VS ROOM TARGET TO PASS CHECKS & ATTEMPTS!"
  },
  {
    title: "THE ROOM TARGET",
    subtitle: "ONE NUMBER TO RULE THEM ALL",
    bullets: [
      "A SINGLE NUMBER: Displayed prominently on your screen. It applies to everything in the room.",
      "EASY ROLLS (Target -3): If you have specialized tools, training, or an ally's help.",
      "HARD ROLLS (Target +3): Improvised gear, extreme haste, chaotic surroundings, or high-risk feats.",
      "THE ESCALATION DIE: The Target can increase if a room catches fire, collapses, or triggers security locks."
    ],
    details: [
      "Target Difficulty Reference: Easy scenes are Target 10-12. Standard scenes are 13-15. Brutal or epic encounters are 16-18.",
      "Slight Modifiers: Instead of tracking dozens of situational modifiers, everything is collapsed into either standard (Target), EASY (-3), or HARD (+3)."
    ],
    accent: "WATCH THE TARGET CLOSELY—IT DECLARES YOUR RAW CHANCE OF SURVIVAL!"
  },
  {
    title: "HEARTS & EFFORT",
    subtitle: "HOW MUCH WORK DID YOU GET DONE?",
    bullets: [
      "1 HEART = 10 EFFORT POINTS: Tasks, obstacles, and mobs are measured in Hearts.",
      "BASIC (D4): Bare hands, raw muscle, or pure intellect.",
      "WEAPONS & TOOLS (D6): Swords, spears, or hacking tools.",
      "GUNS (D8): Heavy-yield firearms or tactical lasers.",
      "MAGIC & ENERGY (D10): Spells, plasma weapons, or medical nanites.",
      "ULTIMATE (D12): Rolled when you score a Critical Success (Natural 20) on your D20 check! Added to your standard Effort!"
    ],
    details: [
      "Math Example: Attacking an enemy with 2 Hearts (20 HP) using a rifle. Roll D20 + DEX. If you meet the Target, you roll 1D8 (Guns) + your Guns Stat bonus and subtract it from their HP.",
      "Ultimate Roll: If you roll a Natural 20, you do your normal Effort (e.g. D6 weapon) PLUS 1D12 Ultimate Effort on top!"
    ],
    accent: "WEAR DOWN MOB HEALTH AND TASK SECURE BLOCKS HEART-BY-HEART!"
  },
  {
    title: "MOVEMENT AND DISTANCE",
    subtitle: "LOOSE AND INTUITIVE RANGE SPACES",
    bullets: [
      "CLOSE: Within arm's reach. Hand-to-hand combat, touch spells, picking a pocket.",
      "NEAR: A few steps away. Long spear distance, quick-draw, or a standard Move.",
      "FAR: Beyond Near, up to a basic bowshot or terminal sprint. Takes an entire turn to run here.",
      "OUT OF RANGE: Too far to reach in a single turn. You are on your own."
    ],
    details: [
      "Combat range locks: The dnd-hud strictly enforces client-side distance checks: melee weapons are locked to Close/Near; ranged weapons can target Far; lasers/energy can hit Out of Range.",
      "Abstract over grid: Don't spend minutes counting squares. If it looks or feels Close or Near, it is!"
    ],
    accent: "NO RULERS OR EXTREME MATH—KEEP IT THEMATIC AND KEEP MOVING!"
  },
  {
    title: "DEATH, DYING & RECOVERY",
    subtitle: "0 HP IS NOT THE END... YET",
    bullets: [
      "REACHING 0 HP: You drop unconscious. Active spells vanish. You are bleeding out.",
      "ROLL FOR DYING (D4): On your next turn, roll 1D4. You have exactly that many rounds to be saved.",
      "MIRACLE (Natural 20): On your turn while dying, roll a D20. A natural 20 brings you back to life with 1 HP!",
      "RECOVERY check (D20+CON vs Target): Spend your turn to catch your breath and heal CON + 1 HP.",
      "FIRST AID check (D20+INT/WIS vs Target): Touch a dying ally to stop their death clock instantly."
    ],
    details: [
      "Bleeding Out: If your dying rounds count down to zero, your character is dead for real. Roll a new crawler.",
      "Blown to Bits: If an explosion or critical hit does enough damage to reduce you to -20 HP in one hit, you are instantly pulverized—no dying check!"
    ],
    accent: "PERMADEATH IS REAL ON FLOOR 1. DON'T SPLIT THE GROUP!"
  },
  {
    title: "THE LEGENDARY HERO COIN",
    subtitle: "DCC / SYNDICATE SPECIAL ADVANTAGE",
    bullets: [
      "CELEBRATING EPIC PLAY: Awarded by the GM for heroic action, roleplay, or hilarious failures.",
      "MAX 1 AT A TIME: Use it or lose it! No hoarding allowed.",
      "RE-ROLL: Cash it in to re-roll any single die check.",
      "ADD A D12: Spend it to add an ultimate D12 to any check or effort roll.",
      "GIFT IT: Give your Hero Coin to any fellow Crawler at any moment to save their life."
    ],
    details: [
      "No Hoarding: Since you can only carry one Hero Coin, spend it frequently to guarantee high-stakes rolls or pull off massive cinematic moves.",
      "Passing Coins: If another crawler is dying or about to fail a crucial hacking check, you can hand your Hero Coin over to them instantly."
    ],
    accent: "WITNESS ME! HERO COINS SHIFT THE BALANCES OF FATE."
  },
  {
    title: "DCC SPONSORS & AI FAVOUR",
    subtitle: "ALIEN VIEWERS AND CORPORATION BOXES",
    bullets: [
      "CORPORATE VIEWERS: The Syndicate is watching your every move. Entertainment is their currency.",
      "AI FAVOUR (⚡): Points granted by the AI (or GM) for high entertainment value or unhinged actions.",
      "SPENDING FAVOUR: Spend Favour points through your HUD to gain immediate combat advantages.",
      "LOOT BOX UNBOXING: Unlocking sponsored loot boxes is only permitted in designated, secure Safe Rooms."
    ],
    details: [
      "Safe Rooms: Safe Rooms are designated by tags (like 'safe') representing fast-food joints or hotels (McDonald's, Marriott, Taco Bell). Loot is locked unless active mobs is empty and you are inside a Safe Room.",
      "Pre-Tutorial Lockout: Your dashboard, sponsor screens, and inventories may be locked out by Borant Corp warnings until the tutorial floor is completed!"
    ],
    accent: "SPONSORSHIP IS LIFE. APPREASE THE AUDIENCE, SURVIVE THE GAMESHOW!"
  }
]

export function TutorialSlideshow({ viewMode }: { viewMode: string }) {
  const isDetail = viewMode.includes('_detail')
  const slideIndex = parseInt(viewMode.replace('_detail', '').split('_')[1], 10) || 0
  const slide = TUTORIAL_SLIDES[slideIndex] || TUTORIAL_SLIDES[0]

  return (
    <div className="absolute inset-0 bg-[#0d0d0f] flex flex-col justify-between p-12 overflow-hidden">
      {/* Grid Pattern Background overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundSize: '40px 40px',
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)'
        }}
      />

      {/* Slide Header */}
      <div className="flex justify-between items-center border-b border-[#1f1f23] pb-4 z-10">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono-dcc text-[10px] font-bold text-[#f59e0b] tracking-[0.3em] uppercase">
            CRAWLER INDUCTION PROGRAM
          </span>
          <span className="font-mono-dcc text-xs text-[#71717a] tracking-widest uppercase">
            SYSTEM TELEMETRY & BASIC INSTRUCTION
          </span>
        </div>
        <div className="font-mono-dcc text-[10px] font-bold text-[#f59e0b] border border-[#f59e0b]/30 bg-[#f59e0b]/5 px-3 py-1.5 rounded uppercase">
          SLIDE {slideIndex + 1} OF {TUTORIAL_SLIDES.length}
        </div>
      </div>

      {/* Main Slide Content - Split Layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-6 min-h-0 z-10">
        {/* Title Card */}
        <div className={`${isDetail ? 'md:col-span-3' : 'md:col-span-4'} flex flex-col gap-3 justify-center`}>
          <span className="font-mono-dcc text-[10px] font-semibold text-[#f59e0b] tracking-[0.25em] uppercase">
            {slide.subtitle}
          </span>
          <h1 className={`font-serif-dcc ${isDetail ? 'text-4xl' : 'text-5xl'} font-normal text-[#f4eee2] uppercase tracking-wide leading-tight`}>
            {slide.title}
          </h1>
          <div className="w-12 h-1 bg-[#f59e0b] mt-1 rounded-[2px]" />
        </div>

        {/* Content Bullets Card */}
        <div className={`${isDetail ? 'md:col-span-4' : 'md:col-span-8'} bg-[#161619]/65 border border-[#1f1f23] rounded p-6 flex flex-col justify-center gap-4 shadow-2xl h-full overflow-y-auto`}>
          <div className="font-mono-dcc text-[9px] font-bold text-[#71717a] tracking-widest uppercase border-b border-[#1f1f23] pb-1 mb-1">
            CORE PRINCIPLES
          </div>
          {slide.bullets.map((bullet, idx) => {
            const [boldPart, rest] = bullet.includes(':') ? bullet.split(':') : [null, bullet]
            return (
              <div key={idx} className="flex gap-3 items-start text-[#f4eee2] font-sans text-sm leading-relaxed">
                <span className="text-[#f59e0b] font-mono-dcc mt-0.5 font-bold text-xs">▶</span>
                <p className="text-zinc-300">
                  {boldPart ? (
                    <>
                      <strong className="text-[#f59e0b] font-mono-dcc text-[10px] tracking-wider uppercase font-bold mr-1.5">
                        {boldPart.trim()}:
                      </strong>
                      <span>{rest.trim()}</span>
                    </>
                  ) : (
                    <span>{bullet}</span>
                  )}
                </p>
              </div>
            )
          })}
        </div>

        {/* Details Card (Only shown if isDetail is true) */}
        {isDetail && (
          <div className="md:col-span-5 bg-[#312411]/20 border border-[#f59e0b]/20 rounded p-6 flex flex-col justify-center gap-4 shadow-[0_0_50px_rgba(245,158,11,0.05)] h-full overflow-y-auto">
            <div className="font-mono-dcc text-[9px] font-bold text-[#f59e0b] tracking-widest uppercase border-b border-[#f59e0b]/20 pb-1 mb-1 animate-pulse">
              ⚡ REINFORCED SCHEMATICS / DETAILS
            </div>
            {slide.details && slide.details.map((detail, idx) => {
              const [boldPart, rest] = detail.includes('?') || detail.includes(':') ? detail.split(/[:?]/) : [null, detail]
              return (
                <div key={idx} className="flex gap-3 items-start text-[#f4eee2] font-sans text-sm leading-relaxed">
                  <span className="text-[#f59e0b]/70 font-mono-dcc mt-0.5 font-semibold text-xs">⚡</span>
                  <p className="text-zinc-400">
                    {boldPart ? (
                      <>
                        <strong className="text-[#f4eee2] font-mono-dcc text-[10px] tracking-wider uppercase font-bold mr-1.5">
                          {boldPart.trim()}{detail.includes('?') ? '?' : ':'}
                        </strong>
                        <span>{rest.trim()}</span>
                      </>
                    ) : (
                      <span>{detail}</span>
                    )}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Accent / Quote Box */}
      <div className="border border-[#f59e0b]/15 bg-[#f59e0b]/[0.01] p-4 rounded text-center z-10">
        <p className="font-serif-dcc text-lg italic text-[#f59e0b]/90 tracking-wide">
          "{slide.accent}"
        </p>
      </div>
    </div>
  )
}
