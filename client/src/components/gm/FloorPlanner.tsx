import React, { useState, useEffect, useCallback, useRef } from 'react'
import * as ReactFlowModule from '@xyflow/react'
import type {
  Node,
  Edge,
  NodeProps,
  Connection,
  OnNodeDrag,
  ReactFlowProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { WSMessage } from '../../types'

// @xyflow/react re-exports `default as ReactFlow` which loses its JSX callable
// signature in TypeScript's bundler resolution. Cast through module namespace.
const ReactFlow = ReactFlowModule.ReactFlow as unknown as (
  props: ReactFlowProps<Node, Edge> & React.RefAttributes<HTMLDivElement>
) => React.JSX.Element

const { Background, Controls, useNodesState, useEdgesState, addEdge } = ReactFlowModule

// ── API data shapes ────────────────────────────────────────────

interface FloorPlan {
  id: string
  name: string
  theme: string
}

interface FloorRoom {
  id: string
  planId: string
  name: string
  description: string
  tags: string[]
  roomTarget: number
  flavourArt: string | null
  posX: number
  posY: number
}

interface RoomConnection {
  id: string
  fromRoomId: string
  toRoomId: string
  label: string
  isContingency: boolean
}

// ── Normalise tags from API (DB returns comma string, UI wants array) ──
function normaliseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags as string[]
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean)
  return []
}

// ── Theme options ──────────────────────────────────────────────

const THEMES = [
  'the-commons',
  'frozen-tomb',
  'chaos-shrine',
  'iron-foundry',
  'merchant-underbelly',
] as const

// ── Tag → border colour helper ─────────────────────────────────

function tagBorderClass(tags: string[]): string {
  if (tags.includes('boss'))      return 'border-red-600'
  if (tags.includes('trap'))      return 'border-amber-500'
  if (tags.includes('narrative')) return 'border-blue-500'
  if (tags.includes('loot-room')) return 'border-green-600'
  if (tags.includes('safe'))      return 'border-teal-500'
  return 'border-hud-border'
}

// ── Custom node component ──────────────────────────────────────

type RoomNodeData = {
  label: string
  tags: string[]
}

type RoomNode = Node<RoomNodeData, 'room'>

function RoomNodeComponent({ data, selected }: NodeProps<RoomNode>) {
  const borderClass = tagBorderClass(data.tags)
  return (
    <div
      className={`bg-hud-panel border ${borderClass} px-3 py-2 min-w-[120px] cursor-pointer ${selected ? 'ring-1 ring-hud-accent' : ''}`}
    >
      <div className="font-hud text-xs text-hud-text truncate">{data.label}</div>
      {data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {data.tags.map(tag => (
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
    data: { label: room.name, tags: normaliseTags(room.tags) } as RoomNodeData,
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

// ── Room Edit Sidebar ──────────────────────────────────────────

interface RoomEditPanelProps {
  room: FloorRoom
  planId: string
  onClose: () => void
  onUpdated: (room: FloorRoom) => void
  onDeleted: (roomId: string) => void
}

function RoomEditPanel({ room, planId, onClose, onUpdated, onDeleted }: RoomEditPanelProps) {
  const [name, setName] = useState(room.name)
  const [description, setDescription] = useState(room.description)
  const [tags, setTags] = useState(room.tags.join(', '))
  const [roomTarget, setRoomTarget] = useState(String(room.roomTarget))
  const [flavourArt, setFlavourArt] = useState(room.flavourArt ?? '')
  const [deleting, setDeleting] = useState(false)

  // Keep local state in sync if room prop changes (different node selected)
  useEffect(() => {
    setName(room.name)
    setDescription(room.description)
    setTags(room.tags.join(', '))
    setRoomTarget(String(room.roomTarget))
    setFlavourArt(room.flavourArt ?? '')
    setDeleting(false)
  }, [room.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async (patch: Partial<FloorRoom>) => {
    const res = await fetch(`/api/floor-plans/${planId}/rooms/${room.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated: FloorRoom = await res.json()
      onUpdated(updated)
    }
  }, [planId, room.id, onUpdated])

  const handleDelete = async () => {
    if (!deleting) { setDeleting(true); return }
    await fetch(`/api/floor-plans/${planId}/rooms/${room.id}`, { method: 'DELETE' })
    onDeleted(room.id)
    onClose()
  }

  return (
    <div className="w-72 flex-shrink-0 border-l border-hud-border bg-hud-panel flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-hud-border flex-shrink-0">
        <span className="font-hud text-xs text-hud-accent tracking-wider">ROOM EDIT</span>
        <button onClick={onClose} className="font-hud text-hud-muted hover:text-hp-low transition-colors text-xs">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
        {/* Name */}
        <label className="flex flex-col gap-1">
          <span className="font-hud text-[10px] text-hud-muted tracking-wider">ROOM NAME</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => save({ name })}
            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
          />
        </label>

        {/* Description */}
        <label className="flex flex-col gap-1">
          <span className="font-hud text-[10px] text-hud-muted tracking-wider">DESCRIPTION / GM NOTES</span>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={() => save({ description })}
            rows={4}
            className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none resize-none"
          />
        </label>

        {/* Tags */}
        <label className="flex flex-col gap-1">
          <span className="font-hud text-[10px] text-hud-muted tracking-wider">TAGS (comma-separated)</span>
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            onBlur={() => save({ tags: tags.split(',').map(t => t.trim()).filter(Boolean) })}
            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder="boss, trap, loot-room..."
            className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
          />
        </label>

        {/* Room target */}
        <label className="flex flex-col gap-1">
          <span className="font-hud text-[10px] text-hud-muted tracking-wider">ROOM TARGET</span>
          <input
            type="number"
            value={roomTarget}
            onChange={e => setRoomTarget(e.target.value)}
            onBlur={() => save({ roomTarget: parseInt(roomTarget) || 10 })}
            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
          />
        </label>

        {/* Flavour art */}
        <label className="flex flex-col gap-1">
          <span className="font-hud text-[10px] text-hud-muted tracking-wider">FLAVOUR ART URL</span>
          <input
            value={flavourArt}
            onChange={e => setFlavourArt(e.target.value)}
            onBlur={() => save({ flavourArt: flavourArt || null })}
            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder="https://..."
            className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
          />
        </label>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className={`mt-auto font-hud text-xs border py-2 transition-colors tracking-wider ${
            deleting
              ? 'border-red-600 text-red-400 bg-red-950'
              : 'border-hud-border text-hud-muted hover:border-red-700 hover:text-red-400'
          }`}
        >
          {deleting ? 'CONFIRM DELETE?' : 'DELETE ROOM'}
        </button>
      </div>
    </div>
  )
}

// ── Connection Panel ───────────────────────────────────────────

interface ConnectionPanelProps {
  planId: string
  rooms: FloorRoom[]
  connections: RoomConnection[]
  onConnectionAdded: (conn: RoomConnection) => void
  onConnectionRemoved: (connId: string) => void
}

function ConnectionPanel({ planId, rooms, connections, onConnectionAdded, onConnectionRemoved }: ConnectionPanelProps) {
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [label, setLabel] = useState('')
  const [isContingency, setIsContingency] = useState(false)
  const [adding, setAdding] = useState(false)

  const addConnection = async () => {
    if (!fromId || !toId) return
    setAdding(true)
    try {
      const res = await fetch(`/api/floor-plans/${planId}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromRoomId: fromId, toRoomId: toId, label, isContingency }),
      })
      if (res.ok) {
        const conn: RoomConnection = await res.json()
        onConnectionAdded(conn)
        setLabel('')
        setIsContingency(false)
      }
    } finally {
      setAdding(false)
    }
  }

  const removeConnection = async (connId: string) => {
    await fetch(`/api/floor-plans/${planId}/connections/${connId}`, { method: 'DELETE' })
    onConnectionRemoved(connId)
  }

  const roomName = (id: string) => rooms.find(r => r.id === id)?.name ?? id

  return (
    <div className="border-t border-hud-border p-4 flex flex-col gap-3">
      <div className="font-hud text-[10px] text-hud-muted tracking-wider">CONNECTIONS</div>

      {/* Add connection controls */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <select value={fromId} onChange={e => setFromId(e.target.value)}
            className="flex-1 bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1 focus:border-hud-accent outline-none">
            <option value="">From room...</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={toId} onChange={e => setToId(e.target.value)}
            className="flex-1 bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1 focus:border-hud-accent outline-none">
            <option value="">To room...</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label..."
            className="flex-1 bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1 focus:border-hud-accent outline-none" />
          <label className="flex items-center gap-1 font-hud text-[10px] text-hud-muted cursor-pointer select-none">
            <input type="checkbox" checked={isContingency} onChange={e => setIsContingency(e.target.checked)}
              className="accent-purple-500" />
            CONTINGENCY
          </label>
        </div>
        <button onClick={addConnection} disabled={adding || !fromId || !toId}
          className="font-hud text-xs border border-hud-border text-hud-muted px-3 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors disabled:opacity-40 tracking-wider">
          ADD CONNECTION
        </button>
      </div>

      {/* Existing connections */}
      {connections.length > 0 && (
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
          {connections.map(conn => (
            <div key={conn.id} className="flex items-center justify-between gap-2 border border-hud-border px-2 py-1">
              <span className="font-hud text-[10px] text-hud-muted truncate">
                {roomName(conn.fromRoomId)} → {roomName(conn.toRoomId)}
                {conn.label ? ` [${conn.label}]` : ''}
                {conn.isContingency ? ' ···' : ''}
              </span>
              <button onClick={() => removeConnection(conn.id)}
                className="font-hud text-[10px] text-hud-muted hover:text-hp-low transition-colors flex-shrink-0">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main FloorPlanner ──────────────────────────────────────────

interface FloorPlannerProps {
  send: (msg: WSMessage) => void
}

export function FloorPlanner({ send: _send }: FloorPlannerProps) {
  const [plans, setPlans] = useState<FloorPlan[]>([])
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<FloorRoom[]>([])
  const [connections, setConnections] = useState<RoomConnection[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Use a ref so drag handler always has the latest planId without stale closure
  const activePlanIdRef = useRef<string | null>(null)
  activePlanIdRef.current = activePlanId

  // ── Load floor plan list on mount ─────────────────────────────
  useEffect(() => {
    fetch('/api/floor-plans')
      .then(r => r.json())
      .then((data: FloorPlan[]) => setPlans(data))
      .catch(() => {/* silently ignore */ })
  }, [])

  // ── Load selected plan's rooms + connections ───────────────────
  useEffect(() => {
    if (!activePlanId) return
    setLoadingPlan(true)
    fetch(`/api/floor-plans/${activePlanId}`)
      .then(r => r.json())
      .then((data: { rooms: FloorRoom[]; connections: RoomConnection[] }) => {
        const normRooms = data.rooms.map(r => ({ ...r, tags: normaliseTags(r.tags) }))
        setRooms(normRooms)
        setConnections(data.connections)
        setNodes(normRooms.map(roomToNode))
        setEdges(data.connections.map(connectionToEdge))
        setSelectedRoomId(null)
      })
      .catch(() => {/* silently ignore */ })
      .finally(() => setLoadingPlan(false))
  }, [activePlanId, setNodes, setEdges])

  // ── Sync rooms → nodes when rooms change ──────────────────────
  useEffect(() => {
    setNodes(prev => prev.map(n => {
      const room = rooms.find(r => r.id === n.id)
      if (!room) return n
      return { ...n, data: { label: room.name, tags: normaliseTags(room.tags) } }
    }))
  }, [rooms, setNodes])

  // ── Create new floor plan ──────────────────────────────────────
  const createPlan = async () => {
    const name = prompt('Floor plan name?')
    if (!name?.trim()) return
    const theme = prompt(`Theme? (${THEMES.join(', ')})`) ?? THEMES[0]
    const validTheme = THEMES.includes(theme as typeof THEMES[number]) ? theme : THEMES[0]
    const res = await fetch('/api/floor-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), theme: validTheme }),
    })
    if (res.ok) {
      const plan: FloorPlan = await res.json()
      setPlans(prev => [...prev, plan])
      setActivePlanId(plan.id)
    }
  }

  // ── Add room ──────────────────────────────────────────────────
  const addRoom = async () => {
    if (!activePlanId) return
    // Sensible default: offset from centre
    const posX = 100 + (rooms.length % 5) * 160
    const posY = 100 + Math.floor(rooms.length / 5) * 120
    const res = await fetch(`/api/floor-plans/${activePlanId}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Room', posX, posY }),
    })
    if (res.ok) {
      const room: FloorRoom = await res.json()
      const normRoom = { ...room, tags: normaliseTags(room.tags) }
      setRooms(prev => [...prev, normRoom])
      setNodes(prev => [...prev, roomToNode(normRoom)])
    }
  }

  // ── Node drag end — persist position ──────────────────────────
  const onNodeDragStop: OnNodeDrag = useCallback(async (_event, node) => {
    const planId = activePlanIdRef.current
    if (!planId) return
    await fetch(`/api/floor-plans/${planId}/rooms/${node.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posX: Math.round(node.position.x), posY: Math.round(node.position.y) }),
    })
    // Update local rooms state too
    setRooms(prev => prev.map(r => r.id === node.id ? { ...r, posX: Math.round(node.position.x), posY: Math.round(node.position.y) } : r))
  }, [])

  // ── Node click — open edit panel ──────────────────────────────
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedRoomId(node.id)
  }, [])

  // ── ReactFlow connect handler (drag edge between nodes) ────────
  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge(connection, eds))
  }, [setEdges])

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) ?? null

  // ── Room edit callbacks ────────────────────────────────────────
  const handleRoomUpdated = useCallback((updated: FloorRoom) => {
    setRooms(prev => prev.map(r => r.id === updated.id ? updated : r))
  }, [])

  const handleRoomDeleted = useCallback((roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId))
    setNodes(prev => prev.filter(n => n.id !== roomId))
    setEdges(prev => prev.filter(e => e.source !== roomId && e.target !== roomId))
    setConnections(prev => prev.filter(c => c.fromRoomId !== roomId && c.toRoomId !== roomId))
  }, [setNodes, setEdges])

  // ── Connection callbacks ───────────────────────────────────────
  const handleConnectionAdded = useCallback((conn: RoomConnection) => {
    setConnections(prev => [...prev, conn])
    setEdges(prev => [...prev, connectionToEdge(conn)])
  }, [setEdges])

  const handleConnectionRemoved = useCallback((connId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connId))
    setEdges(prev => prev.filter(e => e.id !== connId))
  }, [setEdges])

  return (
    <div className="flex flex-col h-full overflow-hidden bg-hud-bg">

      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-hud-border bg-hud-panel px-4 py-2 flex items-center gap-3 flex-wrap">
        <span className="font-hud text-xs text-hud-accent tracking-widest">FLOOR PLANNER</span>

        {/* Plan selector */}
        <select
          value={activePlanId ?? ''}
          onChange={e => setActivePlanId(e.target.value || null)}
          className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1 focus:border-hud-accent outline-none"
        >
          <option value="">— select floor plan —</option>
          {plans.map(p => (
            <option key={p.id} value={p.id}>{p.name} [{p.theme}]</option>
          ))}
        </select>

        <button
          onClick={createPlan}
          className="font-hud text-xs border border-hud-border text-hud-muted px-3 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider"
        >
          + NEW FLOOR
        </button>

        {activePlanId && (
          <button
            onClick={addRoom}
            className="font-hud text-xs border border-hud-border text-hud-muted px-3 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider"
          >
            + ADD ROOM
          </button>
        )}

        {loadingPlan && (
          <span className="font-hud text-xs text-hud-muted animate-pulse">Loading...</span>
        )}
      </div>

      {/* Body: canvas + optional edit sidebar */}
      <div className="flex flex-1 overflow-hidden">

        {/* React Flow canvas */}
        <div className="flex-1 relative">
          {!activePlanId ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center h-full gap-4 opacity-60">
              <div className="text-6xl">🗺️</div>
              <div className="font-hud text-hud-muted tracking-widest text-sm">SELECT A FLOOR PLAN ABOVE OR CREATE A NEW ONE</div>
              <div className="flex flex-col gap-1 text-xs text-hud-muted">
                <div>→ Drag rooms to arrange your dungeon layout</div>
                <div>→ Click any room to edit its name, mobs, and GM notes</div>
                <div>→ Dashed edges are contingency paths — solid edges are the main route</div>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              fitView
              colorMode="dark"
              style={{ background: 'oklch(8% 0.015 265)' }}
            >
              <Background color="oklch(22% 0.02 265)" gap={24} />
              <Controls />
            </ReactFlow>
          )}
        </div>

        {/* Edit sidebar — slides in when a node is selected */}
        {selectedRoom && activePlanId && (
          <div className="flex flex-col border-l border-hud-border overflow-hidden">
            <RoomEditPanel
              room={selectedRoom}
              planId={activePlanId}
              onClose={() => setSelectedRoomId(null)}
              onUpdated={handleRoomUpdated}
              onDeleted={handleRoomDeleted}
            />
            <ConnectionPanel
              planId={activePlanId}
              rooms={rooms}
              connections={connections}
              onConnectionAdded={handleConnectionAdded}
              onConnectionRemoved={handleConnectionRemoved}
            />
          </div>
        )}
      </div>
    </div>
  )
}
