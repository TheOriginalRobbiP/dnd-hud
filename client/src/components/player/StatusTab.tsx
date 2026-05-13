import { useState, useEffect, useRef } from 'react'
import type { Character, FloorState } from '../../types'
import { HPBar } from '../shared/HPBar'
import { PartySidebar } from './PartySidebar'

const STATS = ['STR','DEX','CON','INT','CHA'] as const

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2,'0')
  const s = (secs % 60).toString().padStart(2,'0')
  return `${m}:${s}`
}

interface StatusTabProps {
  character: Character
  floor: FloorState
  allCharacters: Character[]
  onInspect?: (charId: string) => void
}

export function StatusTab({ character, floor, allCharacters, onInspect }: StatusTabProps) {
  const { crawlerName, hp, maxHp, mp, maxMp, stats, statusEffects } = character
  const [timerSecs, setTimerSecs] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (floor.collapseTimerActive && floor.collapseTimerStartedAt && floor.collapseTimerSeconds) {
      const elapsed = Math.floor((Date.now() - floor.collapseTimerStartedAt) / 1000)
      setTimerSecs(Math.max(0, floor.collapseTimerSeconds - elapsed))
      timerRef.current = setInterval(() => setTimerSecs(p => Math.max(0, p - 1)), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [floor.collapseTimerActive, floor.collapseTimerStartedAt, floor.collapseTimerSeconds])

  const isCritical = floor.collapseTimerActive && timerSecs <= 120

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* Crawler name */}
      <div>
        <div className="font-hud text-sm text-hud-muted tracking-widest">CRAWLER DESIGNATION</div>
        <div className="font-hud text-3xl text-hud-accent tracking-wider mt-1">{crawlerName.toUpperCase()}</div>
      </div>

      {/* Room target */}
      <div className="border border-hud-border p-3 flex items-center justify-between">
        <div className="font-hud text-sm text-hud-muted tracking-widest">ROOM TARGET</div>
        <div className="font-hud text-4xl text-hud-accent">{floor.roomTarget}</div>
      </div>

      {/* Collapse timer */}
      {floor.collapseTimerActive && (
        <div className={`border p-3 ${isCritical ? 'border-red-800 animate-pulse' : 'border-hud-border'}`}>
          <div className="font-hud text-sm text-hud-muted tracking-widest">FLOOR COLLAPSE</div>
          <div className={`font-hud text-2xl mt-1 ${isCritical ? 'text-red-500' : 'text-hud-text'}`}>{formatTime(timerSecs)}</div>
          {isCritical && <div className="font-hud text-sm text-red-500 mt-1">⚠ GET TO THE STAIRS</div>}
        </div>
      )}

      {/* HP / MP */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex justify-between font-hud text-sm text-hud-muted mb-1">
            <span>HEALTH</span><span>{hp} / {maxHp}</span>
          </div>
          <HPBar current={hp} max={maxHp} className="h-4" />
        </div>
        {maxMp > 0 && (
          <div>
            <div className="flex justify-between font-hud text-sm text-hud-muted mb-1">
              <span>MANA</span><span>{mp} / {maxMp}</span>
            </div>
            <div className="w-full h-3 bg-hud-border">
              <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${maxMp > 0 ? (mp/maxMp)*100 : 0}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div>
        <div className="font-hud text-sm text-hud-muted tracking-widest mb-2">SYSTEM STATS</div>
        <div className="grid grid-cols-5 gap-2">
          {STATS.map(stat => (
            <div key={stat} className="border border-hud-border p-3 text-center">
              <div className="font-hud text-sm text-hud-muted">{stat}</div>
              <div className="font-hud text-2xl text-hud-text">{(stats as any)[stat] ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Party sidebar */}
      <PartySidebar characters={allCharacters} myCharId={character.id} onInspect={onInspect} />

      {/* Status effects */}
      {statusEffects.length > 0 && (
        <div>
          <div className="font-hud text-sm text-hud-muted tracking-widest mb-2">ACTIVE EFFECTS</div>
          <div className="flex flex-col gap-1">
            {statusEffects.map((e: any) => (
              <div key={e.id} className={`border px-2 py-1 flex justify-between ${e.type === 'buff' ? 'border-green-900' : 'border-red-900'}`}>
                <span className={`font-hud text-sm ${e.type === 'buff' ? 'text-green-400' : 'text-red-400'}`}>{e.name}</span>
                {e.duration !== null && <span className="font-hud text-sm text-hud-muted">{e.duration}r</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
