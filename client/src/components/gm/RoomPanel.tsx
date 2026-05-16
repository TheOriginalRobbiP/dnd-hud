import { useState, useEffect, useRef } from 'react'
import type { FloorState, WSMessage } from '../../types'
import { MobTracker } from './MobTracker'

interface RoomPanelProps {
  floor: FloorState
  send: (msg: WSMessage) => void
}

function formatTime(secs: number) {
  if (isNaN(secs) || secs <= 0) return '--:--'
  const m = Math.floor(secs / 60).toString().padStart(2,'0')
  const s = (secs % 60).toString().padStart(2,'0')
  return `${m}:${s}`
}

export function RoomPanel({ floor, send }: RoomPanelProps) {
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetVal, setTargetVal] = useState(String(floor.roomTarget))
  const [editingNeighbourhood, setEditingNeighbourhood] = useState(false)
  const [neighbourhoodVal, setNeighbourhoodVal] = useState(floor.neighbourhoodName)
  const [roomNotes, setRoomNotes] = useState('')
  const [timerSecs, setTimerSecs] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { setTargetVal(String(floor.roomTarget)) }, [floor.roomTarget])

  useEffect(() => {
    if (floor.collapseTimerActive && floor.collapseTimerStartedAt && floor.collapseTimerSeconds) {
      const elapsed = Math.floor((Date.now() - floor.collapseTimerStartedAt) / 1000)
      setTimerSecs(Math.max(0, floor.collapseTimerSeconds - elapsed))
      timerRef.current = setInterval(() => setTimerSecs(p => Math.max(0, p - 1)), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setTimerSecs(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [floor.collapseTimerActive, floor.collapseTimerStartedAt, floor.collapseTimerSeconds])

  const startTimer = () => {
    const mins = parseInt(prompt('Collapse timer — minutes?') ?? '10')
    if (isNaN(mins) || mins <= 0) return
    send({ type: 'collapse_timer_start', seconds: mins * 60 })
  }

  const isCritical = floor.collapseTimerActive && timerSecs <= 120

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Compact room header strip ─────────────────────── */}
      <div className="border-b border-hud-border bg-hud-panel px-4 py-2 flex items-center gap-4 flex-wrap flex-shrink-0">

        {/* Floor + neighbourhood — click to edit */}
        <div className="flex items-center gap-2">
          <span className="font-hud text-xs text-hud-muted tracking-wider">FL</span>
          <span className="font-hud text-hud-accent text-sm">{floor.floorNumber}</span>
          <span className="font-hud text-hud-muted text-xs">·</span>
          {editingNeighbourhood
            ? <input autoFocus value={neighbourhoodVal} onChange={e => setNeighbourhoodVal(e.target.value)}
                onBlur={() => { send({ type: 'floor_update', floor: { neighbourhoodName: neighbourhoodVal } }); setEditingNeighbourhood(false) }}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                className="bg-hud-bg border border-hud-accent text-hud-accent font-hud text-sm px-1 outline-none w-36" />
            : <span onClick={() => setEditingNeighbourhood(true)}
                className="font-hud text-sm text-hud-text cursor-pointer hover:text-hud-accent transition-colors">
                {floor.neighbourhoodName}
              </span>
          }
        </div>

        {/* Room counter */}
        <div className="flex items-center gap-1">
          <span className="font-hud text-xs text-hud-muted tracking-wider">ROOM</span>
          <button onClick={() => send({ type: 'floor_update', floor: { roomNumber: Math.max(1, floor.roomNumber - 1) } })}
            className="font-hud text-hud-muted px-1 hover:text-hud-accent transition-colors text-xs">◀</button>
          <span className="font-hud text-sm text-hud-text w-5 text-center">{floor.roomNumber}</span>
          <button onClick={() => send({ type: 'floor_update', floor: { roomNumber: floor.roomNumber + 1 } })}
            className="font-hud text-hud-muted px-1 hover:text-hud-accent transition-colors text-xs">▶</button>
        </div>

        {/* Room target — compact inline */}
        <div className="flex items-center gap-2 border border-hud-border px-3 py-1">
          <span className="font-hud text-xs text-hud-muted tracking-wider">TARGET</span>
          {editingTarget
            ? <input autoFocus value={targetVal} onChange={e => setTargetVal(e.target.value)}
                onBlur={() => { send({ type: 'room_target_update', target: parseInt(targetVal) || 10 }); setEditingTarget(false) }}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-12 bg-hud-bg border-0 text-hud-accent font-hud text-xl text-center outline-none" />
            : <span onClick={() => setEditingTarget(true)}
                className="font-hud text-xl text-hud-accent cursor-pointer hover:opacity-70 select-none min-w-[1.5rem] text-center">
                {floor.roomTarget}
              </span>
          }
        </div>

        {/* Collapse timer — compact */}
        {floor.collapseTimerActive ? (
          <div className={`flex items-center gap-2 border px-3 py-1 ${isCritical ? 'border-red-800 animate-pulse' : 'border-hud-border'}`}>
            <span className="font-hud text-xs text-hud-muted">⏱</span>
            <span className={`font-hud text-sm ${isCritical ? 'text-red-500' : 'text-hud-text'}`}>{!floor.collapseTimerActive ? '--:--' : formatTime(timerSecs)}</span>
            <button onClick={() => send({ type: 'collapse_timer_stop' })}
              className="font-hud text-xs text-hud-muted hover:text-red-400 transition-colors ml-1">✕</button>
          </div>
        ) : (
          <button onClick={startTimer}
            className="font-hud text-xs border border-hud-border text-hud-muted px-3 py-1 hover:border-red-800 hover:text-red-400 transition-colors">
            ⏱ TIMER
          </button>
        )}

        {/* Room notes — collapsed into a small button that opens inline */}
        <RoomNotesButton notes={roomNotes} onChange={setRoomNotes} />
      </div>

      {/* ── Mob tracker — gets all remaining space ─────────── */}
      <div className="flex-1 overflow-y-auto">
        <MobTracker mobs={floor.activeMobs} currentFloor={floor.floorNumber} send={send} />
      </div>
    </div>
  )
}

function RoomNotesButton({ notes, onChange }: { notes: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative ml-auto">
      <button onClick={() => setOpen(o => !o)}
        className={`font-hud text-xs border px-3 py-1 transition-colors ${notes.trim() ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'}`}>
        {notes.trim() ? '📝 NOTES ●' : '📝 NOTES'}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-72 bg-hud-panel border border-hud-border p-3 flex flex-col gap-2 shadow-xl">
          <div className="font-hud text-xs text-hud-muted tracking-wider">ROOM NOTES (GM ONLY)</div>
          <textarea value={notes} onChange={e => onChange(e.target.value)} rows={4}
            autoFocus
            placeholder="Private notes — not synced to players..."
            className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none resize-none" />
          <button onClick={() => setOpen(false)}
            className="font-hud text-xs border border-hud-border text-hud-muted px-2 py-1 hover:border-hud-accent self-end">
            DONE
          </button>
        </div>
      )}
    </div>
  )
}
