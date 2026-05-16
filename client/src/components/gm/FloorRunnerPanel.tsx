import React, { useState, useEffect, useCallback, useRef } from 'react'
import * as ReactFlowModule from '@xyflow/react'
import type {
  Node,
  Edge,
  NodeProps,
  ReactFlowProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { WSMessage } from '../../types'

// @xyflow/react re-exports `default as ReactFlow` which loses its JSX callable
// signature in TypeScript's bundler resolution. Cast through module namespace.
const ReactFlow = ReactFlowModule.ReactFlow as unknown as (
  props: ReactFlowProps<Node, Edge> & React.RefAttributes<HTMLDivElement>
) => React.JSX.Element

const { Background, Controls, useNodesState } = ReactFlowModule

// ── API data shapes ────────────────────────────────────────────
// Copied from FloorPlanner — do not re-import from there.

interface FloorPlan {
  id: string
  name: string
  theme: string
  themeColour: string
  isActive: boolean
}

interface FloorRoom {
  id: string
  floorPlanId?: string   // server field name varies; planId also used
  planId?: string
  name: string
  description: string
  tags: string[] | string
  roomTarget: number
  flavourArt: string | null
  mobTemplateIds: string   // comma-separated template IDs
  posX: number
  posY: number
  isCurrentRoom: boolean
  isVisited: boolean
}

interface RoomConnection {
  id: string
  fromRoomId: string
  toRoomId: string
  label: string
  isContingency: boolean
}

interface MobTemplate {
  id: string
  name: string
  hpMax: number
  effortType: 'basic' | 'weapon' | 'magic'
  abilities: string
}

// ── Tag → border colour helper ─────────────────────────────────

function tagBorderClass(tags: string[]): string {
  if (tags.includes('boss'))      return 'border-red-600'
  if (tags.includes('trap'))      return 'border-amber-500'
  if (tags.includes('narrative')) return 'border-blue-500'
  if (tags.includes('loot-room')) return 'border-green-600'
  if (tags.includes('safe'))      return 'border-teal-500'
  return 'border-hud-border'
}

function parseTags(tags: string[] | string): string[] {
  if (Array.isArray(tags)) return tags
  if (!tags) return []
  return tags.split(',').map(t => t.trim()).filter(Boolean)
}

// ── Custom node component ──────────────────────────────────────

type RoomNodeData = {
  label: string
  tags: string[]
  isCurrent: boolean
  isVisited: boolean
}

type RoomNode = Node<RoomNodeData, 'room'>

function RoomNodeComponent({ data, selected }: NodeProps<RoomNode>) {
  const tagList = parseTags(data.tags)
  const borderClass = data.isCurrent
    ? 'border-hud-accent animate-pulse'
    : tagBorderClass(tagList)
  const dimClass = data.isVisited && !data.isCurrent ? 'opacity-50' : ''

  return (
    <div
      className={`bg-hud-panel border ${borderClass} px-3 py-2 min-w-[120px] cursor-pointer ${dimClass} ${selected ? 'ring-1 ring-hud-accent' : ''}`}
    >
      <div className="font-hud text-xs text-hud-text truncate">{data.label}</div>
      {data.isCurrent && (
        <div className="font-hud text-[10px] text-hud-accent mt-0.5 tracking-wider">● CURRENT</div>
      )}
      {tagList.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {tagList.map(tag => (
            <span key={tag} className="font-hud text-[10px] border border-hud-border text-hud-muted px-1">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const nodeTypes = { room: RoomNodeComponent }

// ── Conversion helpers ─────────────────────────────────────────

function roomToNode(room: FloorRoom): Node {
  return {
    id: room.id,
    type: 'room',
    position: { x: room.posX, y: room.posY },
    data: {
      label: room.name,
      tags: parseTags(room.tags),
      isCurrent: room.isCurrentRoom,
      isVisited: room.isVisited,
    } as RoomNodeData,
  }
}

function connectionToEdge(conn: RoomConnection): Edge {
  return {
    id: conn.id,
    source: conn.fromRoomId,
    target: conn.toRoomId,
    label: conn.label || undefined,
    style: conn.isContingency ? { strokeDasharray: '5,5' } : undefined,
    data: { isContingency: conn.isContingency },
  }
}

// ── GM Notes Sidebar ───────────────────────────────────────────

interface RoomNotesPanelProps {
  room: FloorRoom
  onClose: () => void
}

function RoomNotesPanel({ room, onClose }: RoomNotesPanelProps) {
  const tagList = parseTags(room.tags)
  return (
    <div className="w-72 flex-shrink-0 border-l border-hud-border bg-hud-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-hud-border flex-shrink-0">
        <span className="font-hud text-xs text-hud-accent tracking-wider">ROOM INFO</span>
        <button onClick={onClose} className="font-hud text-hud-muted hover:text-hp-low transition-colors text-xs">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <span className="font-hud text-[10px] text-hud-muted tracking-wider">ROOM NAME</span>
          <span className="font-hud text-sm text-hud-text">{room.name}</span>
        </div>

        {room.description && (
          <div className="flex flex-col gap-1">
            <span className="font-hud text-[10px] text-hud-muted tracking-wider">GM NOTES</span>
            <p className="font-hud text-sm text-hud-text whitespace-pre-wrap">{room.description}</p>
          </div>
        )}

        {tagList.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="font-hud text-[10px] text-hud-muted tracking-wider">TAGS</span>
            <div className="flex flex-wrap gap-1">
              {tagList.map(tag => (
                <span key={tag} className="font-hud text-[10px] border border-hud-border text-hud-muted px-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="font-hud text-[10px] text-hud-muted tracking-wider">ROOM TARGET</span>
          <span className="font-hud text-sm text-hud-accent">{room.roomTarget}</span>
        </div>

        {room.flavourArt && (
          <div className="flex flex-col gap-1">
            <span className="font-hud text-[10px] text-hud-muted tracking-wider">FLAVOUR ART</span>
            <img src={room.flavourArt} alt={room.name} className="w-full object-cover border border-hud-border" />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="font-hud text-[10px] text-hud-muted tracking-wider">STATUS</span>
          <div className="flex gap-2">
            {room.isCurrentRoom && <span className="font-hud text-[10px] text-hud-accent border border-hud-accent px-1">CURRENT</span>}
            {room.isVisited && <span className="font-hud text-[10px] text-hud-muted border border-hud-border px-1">VISITED</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main FloorRunnerPanel ──────────────────────────────────────

interface FloorRunnerPanelProps {
  send: (msg: WSMessage) => void
}

export function FloorRunnerPanel({ send }: FloorRunnerPanelProps) {
  const [activePlan, setActivePlan] = useState<FloorPlan | null>(null)
  const [rooms, setRooms] = useState<FloorRoom[]>([])
  const [connections, setConnections] = useState<RoomConnection[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [entering, setEntering] = useState<string | null>(null)  // roomId being entered
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])

  // Keep ref for latest planId to avoid stale closures
  const activePlanRef = useRef<FloorPlan | null>(null)
  activePlanRef.current = activePlan

  // ── Load active floor plan on mount ───────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch('/api/floor-plans')
      .then(r => r.json())
      .then(async (plans: FloorPlan[]) => {
        if (cancelled) return
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
        if (cancelled) return
        setRooms(detail.rooms)
        setConnections(detail.connections)
        setNodes(detail.rooms.map(roomToNode))
      })
      .catch(() => setLoading(false))
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [setNodes])

  // ── Sync edges when connections change ────────────────────────
  const [edgeList, setEdgeList] = useState<Edge[]>([])
  useEffect(() => {
    setEdgeList(connections.map(connectionToEdge))
  }, [connections])

  // ── Sync nodes when rooms change ──────────────────────────────
  useEffect(() => {
    setNodes(prev => prev.map(n => {
      const room = rooms.find(r => r.id === n.id)
      if (!room) return n
      return {
        ...n,
        data: {
          label: room.name,
          tags: parseTags(room.tags),
          isCurrent: room.isCurrentRoom,
          isVisited: room.isVisited,
        } as RoomNodeData,
      }
    }))
  }, [rooms, setNodes])

  // ── Enter a room ──────────────────────────────────────────────
  const enterRoom = useCallback(async (roomId: string) => {
    const plan = activePlanRef.current
    if (!plan || entering) return
    setEntering(roomId)

    try {
      // 1. Mark the clicked room as current + visited
      await fetch(`/api/floor-plans/${plan.id}/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCurrentRoom: true, isVisited: true }),
      })

      // 2. Unset isCurrentRoom on all other rooms that were current
      const prevCurrentRooms = rooms.filter(r => r.isCurrentRoom && r.id !== roomId)
      await Promise.all(prevCurrentRooms.map(r =>
        fetch(`/api/floor-plans/${plan.id}/rooms/${r.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCurrentRoom: false }),
        })
      ))

      // Update local state
      setRooms(prev => prev.map(r => ({
        ...r,
        isCurrentRoom: r.id === roomId,
        isVisited: r.id === roomId ? true : r.isVisited,
      })))

      const room = rooms.find(r => r.id === roomId)
      if (!room) return

      // 3. Compute room index for roomNumber
      const roomIndex = rooms.findIndex(r => r.id === roomId)

      // 4. Send floor_update WS message
      send({
        type: 'floor_update',
        floor: {
          roomNumber: roomIndex + 1,
          neighbourhoodName: plan.name,
          roomTarget: room.roomTarget,
          roomDescription: room.description,
        },
      })

      // 5. Send display_room_enter WS message
      send({
        type: 'display_room_enter',
        roomId: room.id,
        roomName: room.name,
        flavourArt: room.flavourArt ?? null,
        roomTarget: room.roomTarget,
        theme: plan.theme,
        themeColour: plan.themeColour,
      })

      // 6. Spawn mob templates
      const templateIds = room.mobTemplateIds
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)

      if (templateIds.length > 0) {
        const allTemplates: MobTemplate[] = await fetch('/api/mobs').then(r => r.json())
        for (const tId of templateIds) {
          const template = allTemplates.find(t => t.id === tId)
          if (template) {
            send({
              type: 'mob_add',
              mob: {
                id: crypto.randomUUID(),
                name: template.name,
                hp: template.hpMax,
                maxHp: template.hpMax,
                effortType: template.effortType,
                notes: template.abilities,
              },
            })
          }
        }
      }
    } finally {
      setEntering(null)
    }
  }, [rooms, entering, send])

  // ── Node click ────────────────────────────────────────────────
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedRoomId(node.id)
    void enterRoom(node.id)
  }, [enterRoom])

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) ?? null

  // ── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-hud-bg">
        <span className="font-hud text-sm text-hud-muted animate-pulse">Loading active floor plan...</span>
      </div>
    )
  }

  if (!activePlan) {
    return (
      <div className="flex-1 flex items-center justify-center bg-hud-bg">
        <span className="font-hud text-sm text-hud-muted italic">No active floor plan. Set one in PLAN mode.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-hud-bg">

      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-hud-border bg-hud-panel px-4 py-2 flex items-center gap-3 flex-wrap">
        <span className="font-hud text-xs text-hud-accent tracking-widest">FLOOR RUNNER</span>
        <span className="font-hud text-xs text-hud-text">{activePlan.name}</span>
        <span className="font-hud text-[10px] text-hud-muted border border-hud-border px-1">{activePlan.theme}</span>
        {entering && (
          <span className="font-hud text-xs text-hud-muted animate-pulse">Entering room...</span>
        )}
        <div className="ml-auto font-hud text-[10px] text-hud-muted">
          {rooms.filter(r => r.isVisited).length}/{rooms.length} rooms visited
        </div>
      </div>

      {/* Body: canvas + optional GM notes sidebar */}
      <div className="flex flex-1 overflow-hidden">

        {/* React Flow canvas — read-only */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edgeList}
            onNodesChange={onNodesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            panOnScroll={true}
            zoomOnScroll={true}
            fitView
            colorMode="dark"
            style={{ background: 'oklch(8% 0.015 265)' }}
          >
            <Background color="oklch(22% 0.02 265)" gap={24} />
            <Controls />
          </ReactFlow>
        </div>

        {/* GM notes sidebar — slides in when a node is selected */}
        {selectedRoom && (
          <RoomNotesPanel
            room={selectedRoom}
            onClose={() => setSelectedRoomId(null)}
          />
        )}
      </div>
    </div>
  )
}
