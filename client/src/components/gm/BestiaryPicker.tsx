import { useState, useEffect, useCallback } from 'react'
import type { WSMessage } from '../../types'

interface MobTemplate {
  id: string
  name: string
  description: string
  hpMin: number
  hpMax: number
  effortType: string
  floor: number
  isElite: boolean
  isBoss: boolean
  abilities: string
  notes: string
  tags: string
}

interface BestiaryPickerProps {
  currentFloor: number
  onSpawn: (mob: { name: string; hp: number; maxHp: number; effortType: string; notes: string }) => void
  onClose: () => void
}

function rollHp(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function BestiaryPicker({ currentFloor, onSpawn, onClose }: BestiaryPickerProps) {
  const [mobs, setMobs] = useState<MobTemplate[]>([])
  const [search, setSearch] = useState('')
  const [floor, setFloor] = useState(String(currentFloor))
  const [filter, setFilter] = useState<'all' | 'elite' | 'boss'>('all')
  const [selected, setSelected] = useState<MobTemplate | null>(null)
  const [loading, setLoading] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (floor) params.set('floor', floor)
      if (filter === 'elite') params.set('elite', 'true')
      if (filter === 'boss') params.set('boss', 'true')
      const res = await fetch(`/api/mobs?${params}`)
      setMobs(await res.json())
    } finally {
      setLoading(false)
    }
  }, [search, floor, filter])

  useEffect(() => { fetch_() }, [fetch_])

  const spawn = () => {
    if (!selected) return
    const hp = rollHp(selected.hpMin, selected.hpMax)
    onSpawn({
      name: selected.name,
      hp,
      maxHp: hp,
      effortType: selected.effortType,
      notes: selected.abilities ? `Abilities: ${selected.abilities}` : '',
    })
    onClose()
  }

  const effortColour = (e: string) => {
    if (e === 'weapon') return 'text-hp-low border-red-900'
    if (e === 'magic') return 'text-hud-accent border-purple-900'
    return 'text-hud-muted border-hud-border'
  }

  return (
    <div className="fixed inset-0 bg-hud-bg/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-hud-panel border border-hud-border w-full max-w-lg p-5 flex flex-col gap-4 max-h-[90vh]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="font-hud text-hud-accent tracking-widest text-sm">BESTIARY</div>
          <button onClick={onClose} aria-label="Close" className="font-hud text-hud-muted hover:text-hp-low px-2">✕</button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search mobs..."
            className="flex-1 bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
          <select value={floor} onChange={e => setFloor(e.target.value)}
            className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none">
            <option value="">All floors</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
            <option value="3">Floor 3</option>
          </select>
        </div>

        {/* Type filter */}
        <div className="flex gap-2">
          {(['all', 'elite', 'boss'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 font-hud text-xs py-2 border transition-colors tracking-wider ${
                filter === f
                  ? f === 'boss' ? 'border-hp-low text-hp-low' : f === 'elite' ? 'border-gold text-gold' : 'border-hud-accent text-hud-accent'
                  : 'border-hud-border text-hud-muted'
              }`}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Mob list */}
        <div className="flex flex-col gap-1 overflow-y-auto flex-1">
          {loading && <div className="font-hud text-sm text-hud-muted animate-pulse p-2">Scanning bestiary...</div>}
          {!loading && mobs.length === 0 && (
            <div className="font-hud text-sm text-hud-muted italic p-2">No mobs found. The floor is clear. Suspicious.</div>
          )}
          {!loading && mobs.map(mob => (
            <button key={mob.id} onClick={() => setSelected(mob)}
              className={`text-left border p-3 transition-colors ${selected?.id === mob.id ? 'border-hud-accent bg-hud-bg' : 'border-hud-border hover:border-hud-accent'}`}>
              <div className="flex justify-between items-start gap-2">
                <span className="font-hud text-sm text-hud-text">{mob.name}</span>
                <div className="flex gap-1 flex-shrink-0">
                  {mob.isBoss && <span className="font-hud text-xs border border-red-800 text-hp-low px-1">BOSS</span>}
                  {mob.isElite && !mob.isBoss && <span className="font-hud text-xs border border-yellow-700 text-yellow-400 px-1">ELITE</span>}
                  <span className={`font-hud text-xs border px-1 ${effortColour(mob.effortType)}`}>{mob.effortType.toUpperCase()}</span>
                  <span className="font-hud text-xs text-hud-muted border border-hud-border px-1">F{mob.floor}</span>
                </div>
              </div>
              <div className="font-hud text-xs text-hud-muted mt-1">HP {mob.hpMin}–{mob.hpMax}</div>
              {selected?.id === mob.id && (
                <div className="mt-2 pt-2 border-t border-hud-border flex flex-col gap-1">
                  <p className="font-hud text-xs text-hud-muted italic">{mob.description}</p>
                  {mob.abilities && <p className="font-hud text-xs text-hud-cyan">⚡ {mob.abilities}</p>}
                  {mob.notes && <p className="font-hud text-xs text-yellow-600">📋 {mob.notes}</p>}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Spawn button */}
        {selected && (
          <button onClick={spawn}
            className="border border-hp-low text-hp-low font-hud text-sm py-3 hover:bg-red-950 transition-colors tracking-wider">
            SPAWN {selected.name.toUpperCase()} ({selected.hpMin}–{selected.hpMax} HP — rolls on spawn)
          </button>
        )}
      </div>
    </div>
  )
}
