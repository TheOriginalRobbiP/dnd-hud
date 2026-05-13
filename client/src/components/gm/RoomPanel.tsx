import { useState, useEffect, useRef } from 'react'
import type { FloorState, WSMessage } from '../../types'
import { MobTracker } from './MobTracker'

interface RoomPanelProps {
  floor: FloorState
  send: (msg: WSMessage) => void
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2,'0')
  const s = (secs % 60).toString().padStart(2,'0')
  return `${m}:${s}`
}

export function RoomPanel({ floor, send }: RoomPanelProps) {
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetVal, setTargetVal] = useState(String(floor.roomTarget))
  const [editingFloor, setEditingFloor] = useState(false)
  const [floorVal, setFloorVal] = useState(String(floor.floorNumber))
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
    <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
      <div className="flex gap-4 items-start">
        <div>
          <div className="font-hud text-sm text-hud-muted mb-1 tracking-wider">FLOOR</div>
          {editingFloor
            ? <input autoFocus value={floorVal} onChange={e => setFloorVal(e.target.value)}
                onBlur={() => { send({ type: 'floor_update', floor: { floorNumber: parseInt(floorVal) || 1 } }); setEditingFloor(false) }}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-16 bg-hud-bg border border-hud-accent text-hud-accent font-hud text-2xl p-1 outline-none" />
            : <div onClick={() => setEditingFloor(true)} className="font-hud text-2xl text-hud-accent cursor-pointer hover:opacity-70">{floor.floorNumber}</div>
          }
        </div>
        <div className="flex-1">
          <div className="font-hud text-sm text-hud-muted mb-1 tracking-wider">NEIGHBOURHOOD</div>
          {editingNeighbourhood
            ? <input autoFocus value={neighbourhoodVal} onChange={e => setNeighbourhoodVal(e.target.value)}
                onBlur={() => { send({ type: 'floor_update', floor: { neighbourhoodName: neighbourhoodVal } }); setEditingNeighbourhood(false) }}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-full bg-hud-bg border border-hud-accent text-hud-accent font-hud text-lg p-1 outline-none" />
            : <div onClick={() => setEditingNeighbourhood(true)} className="font-hud text-lg text-hud-text cursor-pointer hover:text-hud-accent">{floor.neighbourhoodName}</div>
          }
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="font-hud text-sm text-hud-muted tracking-wider">ROOM</div>
        <button onClick={() => send({ type: 'floor_update', floor: { roomNumber: Math.max(1, floor.roomNumber - 1) } })}
          className="border border-hud-border text-hud-muted font-hud px-2 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors">◀</button>
        <span className="font-hud text-xl text-hud-text">{floor.roomNumber}</span>
        <button onClick={() => send({ type: 'floor_update', floor: { roomNumber: floor.roomNumber + 1 } })}
          className="border border-hud-border text-hud-muted font-hud px-2 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors">▶</button>
      </div>

      <div className="border border-hud-border p-4 bg-hud-bg">
        <div className="font-hud text-sm text-hud-muted tracking-widest mb-2">ROOM TARGET</div>
        {editingTarget
          ? <input autoFocus value={targetVal} onChange={e => setTargetVal(e.target.value)}
              onBlur={() => { send({ type: 'room_target_update', target: parseInt(targetVal) || 10 }); setEditingTarget(false) }}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-24 bg-hud-bg border border-hud-accent text-hud-accent font-hud text-5xl text-center outline-none" />
          : <div onClick={() => setEditingTarget(true)} className="font-hud text-5xl text-hud-accent cursor-pointer hover:opacity-70 select-none">{floor.roomTarget}</div>
        }
        <div className="font-hud text-sm text-hud-muted mt-1">CLICK TO EDIT · SYNCS TO ALL PLAYERS</div>
      </div>

      <div className="border border-hud-border p-3">
        <div className="font-hud text-sm text-hud-muted tracking-widest mb-2">FLOOR COLLAPSE TIMER</div>
        {floor.collapseTimerActive ? (
          <div>
            <div className={`font-hud text-3xl ${isCritical ? 'text-red-500 animate-pulse' : 'text-hud-text'}`}>{formatTime(timerSecs)}</div>
            {isCritical && <div className="font-hud text-sm text-red-500 mt-1 animate-pulse">⚠ FLOOR COLLAPSE IMMINENT</div>}
            <button onClick={() => send({ type: 'collapse_timer_stop' })}
              className="mt-2 border border-red-900 text-red-400 font-hud text-sm px-3 py-1 hover:border-red-500 transition-colors">STOP TIMER</button>
          </div>
        ) : (
          <button onClick={startTimer}
            className="border border-hud-border text-hud-muted font-hud text-sm px-3 py-1 hover:border-red-800 hover:text-red-400 transition-colors">
            START TIMER
          </button>
        )}
      </div>

      <MobTracker mobs={floor.activeMobs} currentFloor={floor.floorNumber} send={send} />

      <div>
        <div className="font-hud text-sm text-hud-muted tracking-widest mb-1">ROOM NOTES (GM ONLY)</div>
        <textarea value={roomNotes} onChange={e => setRoomNotes(e.target.value)} rows={3}
          placeholder="Private notes — not synced to players..."
          className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none resize-none" />
      </div>
    </div>
  )
}
