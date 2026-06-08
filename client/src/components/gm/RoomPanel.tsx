import { useState, useEffect, useRef } from 'react'
import type { FloorState, WSMessage } from '../../types'
import { MobTracker } from './MobTracker'
import { GMDiceRoller } from './GMDiceRoller'

interface RoomPanelProps {
  floor: FloorState
  send: (msg: WSMessage) => void
  campaign?: any
}

function formatTime(secs: number) {
  if (isNaN(secs) || secs <= 0) return '--:--'
  const m = Math.floor(secs / 60).toString().padStart(2,'0')
  const s = (secs % 60).toString().padStart(2,'0')
  return `${m}:${s}`
}

export function RoomPanel({ floor, send, campaign }: RoomPanelProps) {
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetVal, setTargetVal] = useState(String(floor.roomTarget))
  const [editingNeighbourhood, setEditingNeighbourhood] = useState(false)
  const [neighbourhoodVal, setNeighbourhoodVal] = useState(floor.neighbourhoodName)
  const [timerSecs, setTimerSecs] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Persistent GM campaign scratchpad & beats ──
  const storageKeyPrefix = `hud:gm:scratchpad:${floor.floorNumber}:${floor.neighbourhoodName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
  const [scratchpad, setScratchpad] = useState('')
  const [beats, setBeats] = useState<Array<{ id: string; text: string; done: boolean }>>([])

  useEffect(() => {
    const savedNotes = localStorage.getItem(`${storageKeyPrefix}:notes`) ?? ''
    setScratchpad(savedNotes)

    const savedBeats = localStorage.getItem(`${storageKeyPrefix}:beats`)
    if (savedBeats) {
      try {
        setBeats(JSON.parse(savedBeats))
      } catch {
        setBeats([])
      }
    } else {
      setBeats([
        { id: 'beat-1', text: 'Describe room transitions with unhinged sci-fi details', done: false },
        { id: 'beat-2', text: 'Present any nearby vendor or alien sponsor screens', done: false },
        { id: 'beat-3', text: 'Build dramatic tension before spawning mobs', done: false },
        { id: 'beat-4', text: 'Seed foreshadowing clues for the boss encounter', done: false },
      ])
    }
  }, [floor.floorNumber, floor.neighbourhoodName])

  const saveScratchpad = (val: string) => {
    setScratchpad(val)
    localStorage.setItem(`${storageKeyPrefix}:notes`, val)
  }

  const saveBeats = (newBeats: typeof beats) => {
    setBeats(newBeats)
    localStorage.setItem(`${storageKeyPrefix}:beats`, JSON.stringify(newBeats))
  }

  useEffect(() => { setTargetVal(String(floor.roomTarget)) }, [floor.roomTarget])

  useEffect(() => {
    if (floor.collapseTimerActive && floor.collapseTimerStartedAt && floor.collapseTimerSeconds) {
      const startedAtMs = typeof floor.collapseTimerStartedAt === 'string'
        ? new Date(floor.collapseTimerStartedAt).getTime()
        : Number(floor.collapseTimerStartedAt);
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000)
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

        {/* Toggle Target Visibility on Shared Display Screen */}
        <button
          onClick={() => send({ type: 'floor_update', floor: { showRoomTarget: !floor.showRoomTarget } })}
          className={`font-hud text-[10px] border px-2 py-1 tracking-wider transition-colors rounded-[2px] ${
            floor.showRoomTarget 
              ? 'border-hud-accent text-hud-accent bg-hud-accent/5 hover:bg-hud-accent/15' 
              : 'border-hud-border text-hud-muted hover:border-hud-muted'
          }`}
          title="Toggle Room Target Visibility on Display Screen"
        >
          {floor.showRoomTarget ? 'TARGET: PUBLIC' : 'TARGET: HIDDEN'}
        </button>

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

        {/* Campaign Notes & Scratchpad Button */}
        <CampaignNotesButton 
          scratchpad={scratchpad} 
          beats={beats} 
          onScratchpadChange={saveScratchpad} 
          onBeatsChange={saveBeats} 
          floor={floor}
        />
      </div>

      {/* GM Quick Roller Panel */}
      <div className="p-3 border-b border-hud-border flex-shrink-0 bg-hud-bg/25">
        <GMDiceRoller send={send} />
      </div>

      {/* ── Mob tracker — gets all remaining space ─────────── */}
      <div className="flex-1 overflow-y-auto">
        <MobTracker floor={floor} send={send} campaign={campaign} />
      </div>
    </div>
  )
}

interface CampaignNotesButtonProps {
  scratchpad: string
  beats: Array<{ id: string; text: string; done: boolean }>
  onScratchpadChange: (val: string) => void
  onBeatsChange: (beats: Array<{ id: string; text: string; done: boolean }>) => void
  floor: FloorState
}

function CampaignNotesButton({ scratchpad, beats, onScratchpadChange, onBeatsChange, floor }: CampaignNotesButtonProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'beats' | 'scratchpad'>('beats')
  const [newBeatText, setNewBeatText] = useState('')

  const handleToggleBeat = (id: string) => {
    const updated = beats.map(b => b.id === id ? { ...b, done: !b.done } : b)
    onBeatsChange(updated)
  }

  const handleAddBeat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBeatText.trim()) return
    const newBeat = {
      id: `beat-${Date.now()}`,
      text: newBeatText.trim(),
      done: false
    }
    onBeatsChange([...beats, newBeat])
    setNewBeatText('')
  }

  const handleDeleteBeat = (id: string) => {
    onBeatsChange(beats.filter(b => b.id !== id))
  }

  const activeBeatsCount = beats.filter(b => b.done).length

  return (
    <div className="relative ml-auto">
      <button onClick={() => setOpen(o => !o)}
        className={`font-hud text-xs border px-3 py-1 transition-colors flex items-center gap-1.5 ${
          scratchpad.trim() || beats.some(b => b.done) 
            ? 'border-hud-accent text-hud-accent bg-hud-accent/5' 
            : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'
        }`}>
        <span>📝</span>
        <span>CAMPAIGN PLANNER</span>
        {beats.length > 0 && (
          <span className="text-[10px] bg-hud-bg px-1 border border-hud-border/40 text-hud-accent font-bold rounded">
            {activeBeatsCount}/{beats.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-[380px] bg-hud-panel border border-hud-border p-4 flex flex-col gap-3 shadow-2xl rounded">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-hud-border/20 pb-2">
            <div className="flex flex-col">
              <span className="font-hud text-[9px] text-hud-accent uppercase tracking-widest font-bold">GM CAMPAIGN DIRECTORY</span>
              <span className="font-hud text-xs text-hud-text font-semibold uppercase truncate max-w-[220px]">
                FL{floor.floorNumber}: {floor.neighbourhoodName}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-hud-muted hover:text-hud-text text-sm">✕</button>
          </div>

          {/* Double Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-hud-bg border border-hud-border/30 p-0.5 rounded">
            <button
              onClick={() => setActiveTab('beats')}
              className={`py-1.5 rounded text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'beats' ? 'bg-hud-accent text-hud-bg font-extrabold' : 'text-hud-muted hover:text-hud-text'
              }`}
            >
              <span>📋</span> STORY BEATS
            </button>
            <button
              onClick={() => setActiveTab('scratchpad')}
              className={`py-1.5 rounded text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'scratchpad' ? 'bg-hud-accent text-hud-bg font-extrabold' : 'text-hud-muted hover:text-hud-text'
              }`}
            >
              <span>📝</span> SCRATCHPAD
            </button>
          </div>

          {/* TAB 1: STORY BEATS Checklist */}
          {activeTab === 'beats' && (
            <div className="flex flex-col gap-2.5">
              <form onSubmit={handleAddBeat} className="flex gap-1.5">
                <input
                  value={newBeatText}
                  onChange={e => setNewBeatText(e.target.value)}
                  placeholder="Add a storytelling beat/reveal..."
                  className="flex-1 bg-hud-bg border border-hud-border/40 text-hud-text font-hud text-xs px-2.5 py-1.5 outline-none focus:border-hud-accent/60 placeholder:text-hud-muted/50"
                />
                <button
                  type="submit"
                  className="font-hud text-[11px] border border-hud-accent text-hud-accent bg-hud-accent/10 px-3 hover:bg-hud-accent hover:text-hud-bg font-extrabold rounded-[2px]"
                >
                  +
                </button>
              </form>

              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {beats.length === 0 ? (
                  <div className="text-center font-hud text-[11px] text-hud-muted italic py-6 border border-dashed border-hud-border/30 rounded">
                    No story beats listed. Keep it free-flow!
                  </div>
                ) : (
                  beats.map(beat => (
                    <div
                      key={beat.id}
                      className={`flex items-center justify-between gap-2 border p-2 bg-hud-bg/30 transition-all rounded-[3px] ${
                        beat.done ? 'border-hud-border/20 opacity-55' : 'border-hud-border/40 hover:border-hud-accent/20'
                      }`}
                    >
                      <label className="flex items-start gap-2.5 min-w-0 flex-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={beat.done}
                          onChange={() => handleToggleBeat(beat.id)}
                          className="mt-0.5 accent-hud-accent"
                        />
                        <span className={`font-hud text-xs text-hud-text leading-snug break-words ${beat.done ? 'line-through text-hud-muted' : ''}`}>
                          {beat.text}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteBeat(beat.id)}
                        className="text-hud-muted hover:text-red-400 text-xs px-1"
                        title="Delete this beat"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PERSISTENT SCRATCHPAD */}
          {activeTab === 'scratchpad' && (
            <div className="flex flex-col gap-2">
              <textarea
                value={scratchpad}
                onChange={e => onScratchpadChange(e.target.value)}
                rows={6}
                placeholder="Private GM notebook — auto-saves instantly and stays specific to this level/neighbourhood..."
                className="w-full bg-hud-bg border border-hud-border/40 text-hud-text font-hud text-xs p-2.5 focus:border-hud-accent outline-none resize-none leading-relaxed rounded"
              />
              <span className="font-hud text-[8px] text-hud-muted italic text-right uppercase">
                ✓ Auto-saved to local browser storage
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center border-t border-hud-border/10 pt-2 mt-1">
            <span className="font-hud text-[8px] text-hud-muted italic">
              Floor {floor.floorNumber} Campaign Directory
            </span>
            <button
              onClick={() => setOpen(false)}
              className="font-hud text-[9px] border border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent px-3 py-1 rounded-[2px]"
            >
              CLOSE
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
