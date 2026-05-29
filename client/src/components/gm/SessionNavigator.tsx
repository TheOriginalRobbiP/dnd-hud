import { useState, useEffect, useCallback } from 'react'
import type { WSMessage, Character, Mob } from '../../types'
import { Battlemap } from '../shared/Battlemap'

// Re-using the same shapes the server returns for the floor planner
interface FloorPlan {
  id: string
  name: string
  theme: string
  themeColour: string
  isActive: boolean
}

interface FloorRoom {
  id: string
  floorPlanId?: string
  planId?: string
  name: string
  description: string
  tags: string[] | string
  roomTarget: number
  flavourArt: string | null
  sceneArt: string | null
  battlemapArt: string | null
  mobTemplateIds: string
  posX: number
  posY: number
  isCurrentRoom: boolean
  isVisited: boolean
}

interface RoomConnection {
  fromRoomId: string
  toRoomId: string
}

interface MobTemplate {
  id: string
  name: string
  hpMax: number
  effortType: 'basic' | 'weapon' | 'magic'
  abilities: string
}

interface SessionNavigatorProps {
  send: (msg: WSMessage) => void
  notesTextSize?: 'sm' | 'md' | 'lg'
  characters: Character[]
  activeMobs: Mob[]
  activeCharIds: string[]
}

// ── Helpers ──────────────────────────────────────────────────
function parseTags(tags: string[] | string | undefined): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try { return JSON.parse(tags) } catch { return [] }
}

function tagPillClass(tag: string): string {
  if (tag === 'start') return 'border-hud-success text-hud-success bg-hud-success/10'
  if (tag === 'boss') return 'border-red-500 text-red-500 bg-red-500/10'
  if (tag === 'loot-room') return 'border-green-400 text-green-400 bg-green-400/10'
  if (tag === 'trap') return 'border-amber-500 text-amber-500 bg-amber-500/10'
  if (tag === 'puzzle') return 'border-blue-400 text-blue-400 bg-blue-400/10'
  if (tag === 'shrine') return 'border-purple-400 text-purple-400 bg-purple-400/10'
  if (tag === 'hazard') return 'border-orange-500 text-orange-500 bg-orange-500/10'
  return 'border-hud-border text-hud-muted'
}

function textSizeClass(size: 'sm' | 'md' | 'lg') {
  if (size === 'sm') return 'text-sm'
  if (size === 'lg') return 'text-lg'
  return 'text-base'
}

function parseDescriptionSections(desc: string) {
  if (!desc) return []
  const blocks = desc.split(/(?=\n### )/)
  return blocks.map(block => {
    const lines = block.trim().split('\n')
    let title = ''
    if (lines[0].startsWith('### ')) {
      title = lines[0].substring(4).trim()
      lines.shift()
    }
    return { title, content: lines.join('\n').trim() }
  }).filter(s => s.title || s.content)
}

// ── Room Item Component ───────────────────────────────────────
function RoomListItem({
  room,
  isCurrent,
  isVisited,
  onClick,
  onEnter,
  entering,
  selected
}: {
  room: FloorRoom
  isCurrent: boolean
  isVisited: boolean
  onClick: () => void
  onEnter: () => void
  entering: boolean
  selected: boolean
}) {
  const tags = parseTags(room.tags)
  const isBoss = tags.includes('boss')
  
  return (
    <div 
      className={`border flex flex-col cursor-pointer transition-colors ${
        isCurrent ? 'border-hud-accent bg-hud-accent/5' :
        selected ? 'border-hud-muted bg-hud-panel' : 
        'border-hud-border bg-hud-panel hover:border-hud-muted'
      }`}
      onClick={onClick}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isCurrent && <span className="w-2 h-2 rounded-full bg-hud-accent animate-pulse flex-shrink-0" />}
            <span className={`font-hud text-lg truncate leading-none ${isCurrent ? 'text-hud-accent' : isVisited ? 'text-hud-muted' : 'text-hud-text'}`}>
              {room.name}
            </span>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map(t => (
                <span key={t} className={`font-hud text-[9px] border px-1.5 py-0.5 tracking-wider ${tagPillClass(t)}`}>
                  {t.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="font-hud text-xl font-bold text-hud-text">
            T:{room.roomTarget}
          </div>
          {!isCurrent && (
            <button
              onClick={(e) => { e.stopPropagation(); onEnter(); }}
              disabled={entering}
              className={`font-hud text-[10px] border px-3 py-1 tracking-widest transition-colors ${
                entering 
                  ? 'border-hud-border text-hud-muted opacity-50 cursor-not-allowed' 
                  : isBoss 
                    ? 'border-red-500 text-red-500 hover:bg-red-500 hover:text-black' 
                    : 'border-hud-accent text-hud-accent hover:bg-hud-accent hover:text-black'
              }`}
            >
              {entering ? 'ENTERING...' : 'ENTER ROOM'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export function SessionNavigator({ send, notesTextSize = 'md', characters, activeMobs, activeCharIds }: SessionNavigatorProps) {
  const [activePlan, setActivePlan] = useState<FloorPlan | null>(null)
  const [viewMode, setViewMode] = useState<'notes' | 'map'>('notes')
  const [displayViewMode, setDisplayViewMode] = useState<'scene' | 'battlemap'>('scene')
  const [rooms, setRooms] = useState<FloorRoom[]>([])
  const [connections, setConnections] = useState<RoomConnection[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [entering, setEntering] = useState<string | null>(null)

  // Reset view mode back to notes when selected room changes
  useEffect(() => {
    setViewMode('notes')
  }, [selectedRoomId])

  // 1. Fetch data
  const fetchData = useCallback(async () => {
    try {
      const plans: FloorPlan[] = await fetch('/api/floor-plans').then(r => r.json())
      const active = plans.find(p => p.isActive)
      
      if (!active) {
        setActivePlan(null)
        setLoading(false)
        return
      }
      setActivePlan(active)

      const detail = await fetch(`/api/floor-plans/${active.id}`).then(r => r.json()) as {
        rooms: FloorRoom[]
        connections: RoomConnection[]
      }

      const rms = detail.rooms || []
      setRooms(rms)
      setConnections(detail.connections || [])
      
      // Auto-select current room if nothing is selected
      if (!selectedRoomId) {
        const current = rms.find((r: FloorRoom) => r.isCurrentRoom)
        if (current) setSelectedRoomId(current.id)
      }
    } catch (err) {
      console.error('Failed to load active plan', err)
    } finally {
      setLoading(false)
    }
  }, [selectedRoomId])

  // Initial load + poll every 5s for room state (isCurrentRoom/isVisited)
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  // 2. Enter room logic (same as FloorRunnerPanel)
  const enterRoom = useCallback(async (roomId: string) => {
    if (entering) return
    const room = rooms.find(r => r.id === roomId)
    const plan = activePlan
    if (!room || !plan) return

    setEntering(roomId)
    try {
      await fetch(`/api/floor-plans/${plan.id}/rooms/${roomId}/enter`, { method: 'POST' })
      setRooms(prev => prev.map(r => ({
        ...r,
        isCurrentRoom: r.id === roomId,
        isVisited: r.isVisited || r.id === roomId
      })))
      setSelectedRoomId(roomId) // auto-focus notes on the room we just entered

      send({
        type: 'display_room_enter',
        roomId,
        roomName: room.name,
        flavourArt: room.flavourArt ?? null,
        sceneArt: room.sceneArt ?? null,
        battlemapArt: room.battlemapArt ?? null,
        roomTarget: room.roomTarget,
        theme: plan.theme,
        themeColour: plan.themeColour,
        tags: Array.isArray(room.tags) ? room.tags.join(',') : (room.tags || ''),
      })
      setDisplayViewMode('scene') // Automatically start in cinematic SCENE mode!
    } finally {
      setEntering(null)
    }
  }, [rooms, activePlan, entering, send])

  // ── Spawn room encounter manually ───────────────────────────
  const spawnEncounter = useCallback(async (room: FloorRoom) => {
    const templateIds = room.mobTemplateIds.split(',').map(s => s.trim()).filter(Boolean)
    if (templateIds.length === 0) return
    
    try {
      const allTemplates: MobTemplate[] = await fetch('/api/mobs').then(r => r.json())
      for (const tId of templateIds) {
        const template = allTemplates.find(t => t.name === tId || t.id === tId)
        if (template) {
          send({
            type: 'mob_add',
            mob: {
              id: crypto.randomUUID(),
              name: template.name,
              hp: template.hpMax,
              maxHp: template.hpMax,
              effortType: template.effortType as 'basic' | 'weapon' | 'magic',
              notes: template.abilities,
            },
          })
        }
      }
      send({ type: 'announcement', text: `Encounter spawned in ${room.name}!`, label: 'SYSTEM' })
    } catch (err) {
      console.error('Failed to spawn encounter', err)
    }
  }, [send])

  // ── Spawn individual mob manually ───────────────────────────
  const spawnIndividualMob = useCallback(async (templateName: string) => {
    try {
      const allTemplates: MobTemplate[] = await fetch('/api/mobs').then(r => r.json())
      const template = allTemplates.find(t => t.name === templateName || t.id === templateName)
      if (template) {
        send({
          type: 'mob_add',
          mob: {
            id: crypto.randomUUID(),
            name: template.name,
            hp: template.hpMax,
            maxHp: template.hpMax,
            effortType: template.effortType as 'basic' | 'weapon' | 'magic',
            notes: template.abilities,
          },
        })
        send({ type: 'announcement', text: `${template.name} spawned in this area!`, label: 'SYSTEM' })
      }
    } catch (err) {
      console.error('Failed to spawn individual mob', err)
    }
  }, [send])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-hud-bg"><span className="font-hud text-sm text-hud-muted animate-pulse">Loading active floor plan...</span></div>
  }

  if (!activePlan) {
    return <div className="flex-1 flex items-center justify-center bg-hud-bg"><span className="font-hud text-sm text-hud-muted italic">No active floor plan. Set one in PLAN mode.</span></div>
  }

  const currentRoom = rooms.find(r => r.isCurrentRoom)
  const selectedRoom = rooms.find(r => r.id === selectedRoomId)
  
  // Find adjacent rooms (where currentRoom is the source)
  const adjacentRoomIds = currentRoom 
    ? connections.filter(c => c.fromRoomId === currentRoom.id).map(c => c.toRoomId)
    : []
  const adjacentRooms = rooms.filter(r => adjacentRoomIds.includes(r.id))
  const otherRooms = rooms.filter(r => !r.isCurrentRoom && !adjacentRoomIds.includes(r.id))

  const bodyTextClass = textSizeClass(notesTextSize)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-hud-bg">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-hud-border bg-hud-panel px-4 py-2 flex items-center gap-3 flex-wrap">
        <span className="font-hud text-xs text-hud-accent tracking-widest">SESSION NAVIGATOR</span>
        <span className="font-hud text-xs text-hud-text">{activePlan.name}</span>
        <span className="font-hud text-[10px] text-hud-muted border border-hud-border px-1">{activePlan.theme}</span>
        <div className="ml-auto font-hud text-[10px] text-hud-muted">
          {rooms.filter(r => r.isVisited).length}/{rooms.length} rooms visited
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        
        {/* Left Col: Navigator List */}
        <div className="flex-[40] min-w-0 border-r border-hud-border flex flex-col overflow-y-auto bg-hud-bg p-4 gap-6">
          
          {/* Current Room Section */}
          <div className="flex flex-col gap-2">
            <span className="font-hud text-xs tracking-widest text-hud-accent pl-1">CURRENT ROOM</span>
            {currentRoom ? (
              <RoomListItem 
                room={currentRoom} 
                isCurrent={true} 
                isVisited={true} 
                onClick={() => setSelectedRoomId(currentRoom.id)}
                onEnter={() => enterRoom(currentRoom.id)}
                entering={entering === currentRoom.id}
                selected={selectedRoomId === currentRoom.id}
              />
            ) : (
              <div className="border border-hud-border border-dashed p-4 text-center font-hud text-sm text-hud-muted">
                No room currently active.
              </div>
            )}
          </div>

          {/* Adjacent Rooms Section */}
          {adjacentRooms.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-hud text-xs tracking-widest text-hud-text pl-1 flex items-center gap-2">
                ADJACENT <span className="w-full h-px bg-hud-border opacity-50 flex-1" />
              </span>
              <div className="flex flex-col gap-2">
                {adjacentRooms.map(r => (
                  <RoomListItem 
                    key={r.id}
                    room={r} 
                    isCurrent={false} 
                    isVisited={r.isVisited} 
                    onClick={() => setSelectedRoomId(r.id)}
                    onEnter={() => enterRoom(r.id)}
                    entering={entering === r.id}
                    selected={selectedRoomId === r.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Rooms Section (Collapsed logic / simple list) */}
          {otherRooms.length > 0 && (
            <div className="flex flex-col gap-2 mt-4 opacity-70 hover:opacity-100 transition-opacity">
              <span className="font-hud text-xs tracking-widest text-hud-muted pl-1 flex items-center gap-2">
                OTHER ROOMS <span className="w-full h-px bg-hud-border flex-1" />
              </span>
              <div className="flex flex-col gap-2">
                {otherRooms.map(r => (
                  <RoomListItem 
                    key={r.id}
                    room={r} 
                    isCurrent={false} 
                    isVisited={r.isVisited} 
                    onClick={() => setSelectedRoomId(r.id)}
                    onEnter={() => enterRoom(r.id)}
                    entering={entering === r.id}
                    selected={selectedRoomId === r.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Selected Room Notes (similar to old RoomNotesPanel) */}
        <div className="flex-[60] min-w-0 flex flex-col bg-hud-panel overflow-hidden">
          {selectedRoom ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-shrink-0 border-b border-hud-border px-5 py-3 flex flex-col gap-2 bg-black/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h2 className="font-hud text-xl text-hud-text leading-tight truncate">{selectedRoom.name}</h2>
                    {parseTags(selectedRoom.tags).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {parseTags(selectedRoom.tags).map(tag => (
                          <span key={tag} className={`font-hud text-[10px] border px-1.5 py-0.5 tracking-wider ${tagPillClass(tag)}`}>
                            {tag.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {selectedRoom.isCurrentRoom && selectedRoom.mobTemplateIds && (
                      <button
                        onClick={() => spawnEncounter(selectedRoom)}
                        className="font-hud text-[10px] border border-red-500 text-red-500 bg-red-500/5 px-2.5 py-1.5 tracking-wider hover:bg-red-500 hover:text-black transition-colors rounded-[2px] font-bold uppercase animate-pulse"
                        title="Spawn this room's mobs onto the Display Screen"
                      >
                        ⚡ Spawn Encounter
                      </button>
                    )}
                    <div className="font-hud text-2xl font-bold text-hud-accent leading-none border border-hud-border px-2 py-1">
                      T:{selectedRoom.roomTarget}
                    </div>
                  </div>
                </div>

                {selectedRoom.isCurrentRoom && selectedRoom.mobTemplateIds && (
                  <div className="flex items-center gap-2 flex-wrap pt-1.5 border-t border-hud-border/20">
                    <span className="font-hud text-[9px] text-hud-muted tracking-widest uppercase mr-1">Spawn Individual:</span>
                    {selectedRoom.mobTemplateIds.split(',').map(s => s.trim()).filter(Boolean).map(mName => (
                      <button
                        key={mName}
                        onClick={() => spawnIndividualMob(mName)}
                        className="font-hud text-[9px] border border-red-900/40 text-red-400 bg-red-950/10 px-2 py-0.5 hover:border-red-500 hover:text-red-500 transition-colors rounded-[2px] font-semibold"
                        title={`Spawn one ${mName}`}
                      >
                        + {mName.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                {/* Mode Toggles: NOTES vs BATTLEMAP */}
                {(selectedRoom.flavourArt || selectedRoom.sceneArt || selectedRoom.battlemapArt) && (
                  <div className="flex gap-4 border-t border-hud-border/25 pt-2.5 mt-1.5 flex-shrink-0 flex-wrap items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewMode('notes')}
                        className={`font-hud text-[10px] border px-3 py-1 font-semibold tracking-wider rounded-[2px] transition-colors ${
                          viewMode === 'notes'
                            ? 'border-hud-accent text-hud-accent bg-hud-accent/5'
                            : 'border-hud-border text-hud-muted hover:border-hud-muted hover:text-hud-text'
                        }`}
                      >
                        📜 ROOM NOTES
                      </button>
                      <button
                        onClick={() => setViewMode('map')}
                        className={`font-hud text-[10px] border px-3 py-1 font-semibold tracking-wider rounded-[2px] transition-colors ${
                          viewMode === 'map'
                            ? 'border-hud-accent text-hud-accent bg-hud-accent/5'
                            : 'border-hud-border text-hud-muted hover:border-hud-muted hover:text-hud-text'
                        }`}
                      >
                        🗺️ BATTLEMAP VTT
                      </button>
                    </div>

                    {/* TV Display viewport controller (GM Only - active on current room) */}
                    {selectedRoom.isCurrentRoom && (
                      <div className="flex items-center gap-2 border-l border-hud-border/30 pl-4">
                        <span className="font-hud text-[8px] text-hud-muted tracking-widest uppercase">TV DISPLAY VIEW:</span>
                        <div className="flex bg-black/45 border border-hud-border/30 p-0.5 rounded select-none">
                          <button
                            onClick={async () => {
                              setDisplayViewMode('scene')
                              send({ type: 'display_view_mode_update', mode: 'scene' })
                            }}
                            className={`px-2.5 py-1 rounded text-[8px] font-bold tracking-widest uppercase transition-colors leading-none ${
                              displayViewMode === 'scene' ? 'bg-[#f59e0b] text-hud-bg font-extrabold shadow-sm' : 'text-hud-muted hover:text-hud-text'
                            }`}
                          >
                            👁️ SCENE
                          </button>
                          <button
                            onClick={async () => {
                              setDisplayViewMode('battlemap')
                              send({ type: 'display_view_mode_update', mode: 'battlemap' })
                            }}
                            className={`px-2.5 py-1 rounded text-[8px] font-bold tracking-widest uppercase transition-colors leading-none ${
                              displayViewMode === 'battlemap' ? 'bg-[#f59e0b] text-hud-bg font-extrabold shadow-sm' : 'text-hud-muted hover:text-hud-text'
                            }`}
                          >
                            ⚔️ BATTLEMAP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {viewMode === 'map' && (selectedRoom.battlemapArt || selectedRoom.flavourArt) ? (
                <div className="flex-1 p-5 pb-24">
                  <Battlemap
                    mapUrl={selectedRoom.battlemapArt || selectedRoom.flavourArt}
                    characters={characters}
                    activeMobs={activeMobs}
                    isEditable={true}
                    activeCharIds={activeCharIds}
                    onTokenMove={(id, isMob, posX, posY) => {
                      if (!isMob) {
                        send({ type: 'token_move', charId: id, posX, posY })
                      } else {
                        send({ type: 'token_move', mobId: id, posX, posY })
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-5 pb-24 prose prose-invert max-w-none">
                  {parseDescriptionSections(selectedRoom.description).length > 0 ? (
                    <div className="flex flex-col gap-6">
                      {parseDescriptionSections(selectedRoom.description).map((sec, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                          {sec.title && (
                            <h3 className="font-hud text-sm text-hud-accent tracking-widest border-b border-hud-border pb-1 m-0">
                              {sec.title}
                            </h3>
                          )}
                          <div className={`text-hud-text whitespace-pre-wrap font-sans leading-relaxed ${bodyTextClass}`}>
                            {sec.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-hud-muted italic font-sans flex items-center justify-center h-32 border border-dashed border-hud-border">
                      No notes provided for this room.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-hud-muted font-hud text-sm border-l border-hud-border border-dashed m-8">
              <span className="text-2xl mb-2 opacity-50">👈</span>
              Select a room to view notes
            </div>
          )}
        </div>
      </div>
    </div>
  )
}