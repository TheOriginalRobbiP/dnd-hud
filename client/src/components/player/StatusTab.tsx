import { useState, useEffect, useRef } from 'react'
import type { Character, FloorState, WSMessage } from '../../types'
import { HPBar } from '../shared/HPBar'
import { PartySidebar } from './PartySidebar'
import { getCrawlerPortrait } from '../../utils/portraits'
import { DiceRoller } from './DiceRoller'

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
  send: (msg: WSMessage) => void
}

export function StatusTab({ character, floor, allCharacters, onInspect, send }: StatusTabProps) {
  const { crawlerName, hp, maxHp, mp, maxMp, stats, statusEffects, skills, aiFavour } = character
  const portrait = getCrawlerPortrait(crawlerName)
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

  const EFFORT_COLOURS: Record<string, string> = {
    basic:   'border-hud-border   text-hud-muted',
    weapon:  'border-red-900      text-red-400',
    magic:   'border-cyan-900     text-cyan-400',
    ultimate:'border-yellow-700   text-yellow-400',
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── COMBAT STRIP — always visible, no scroll ─────── */}
      <div className="flex-shrink-0 p-4 flex flex-col gap-3 border-b border-hud-border">

        {/* Room target + collapse timer inline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-hud-border px-3 py-1.5 flex-1">
            <span className="font-hud text-xs text-hud-muted tracking-widest">TARGET</span>
            <span className="font-hud text-3xl text-hud-accent ml-auto">{floor.roomTarget}</span>
          </div>
          {floor.collapseTimerActive && (
            <div className={`flex items-center gap-2 border px-3 py-1.5 ${isCritical ? 'border-red-800 animate-pulse' : 'border-hud-border'}`}>
              <span className="font-hud text-xs text-hud-muted">⏱</span>
              <span className={`font-hud text-xl ${isCritical ? 'text-red-500' : 'text-hud-text'}`}>{formatTime(timerSecs)}</span>
            </div>
          )}
        </div>

        {/* HP bar — with portrait if available */}
        <div className="flex gap-3 items-start">
          {portrait && (
            <div className="flex-shrink-0 w-16 h-20 border border-hud-border overflow-hidden">
              <img src={portrait} alt={crawlerName} className="w-full h-full object-cover object-top" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between font-hud text-xs text-hud-muted mb-1">
              <span>HEALTH</span><span>{hp} / {maxHp}</span>
            </div>
            <HPBar current={hp} max={maxHp} className="h-5" />
            {maxMp > 0 && (
              <div className="mt-2">
                <div className="flex justify-between font-hud text-xs text-hud-muted mb-1">
                  <span>MANA</span><span>{mp} / {maxMp}</span>
                </div>
                <div className="w-full h-3 bg-hud-border">
                  <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${(mp/maxMp)*100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MP bar — moved into portrait block above */}

        {/* Active status effects — inline chips */}
        {statusEffects.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {statusEffects.map((e: any) => (
              <span key={e.id} className={`font-hud text-xs border px-2 py-0.5 ${e.type === 'buff' ? 'border-green-800 text-green-400' : 'border-red-900 text-red-400'}`}>
                {e.name}{e.duration != null ? ` (${e.duration}r)` : ''}
              </span>
            ))}
          </div>
        )}

        {/* AI Favour — always shown */}
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-base">⚡</span>
          <span className="font-hud text-xs text-hud-muted tracking-wider">AI FAVOUR</span>
          <span className="font-hud text-sm text-yellow-400 font-bold">{aiFavour ?? 0}</span>
          <span className="font-hud text-xs text-hud-muted italic ml-1">
            {(aiFavour ?? 0) === 0 ? '— earn more by being creative' : 'spend in clutch moments'}
          </span>
        </div>

        {/* Dice roller — collapsible */}
        <DiceRoller character={character} floor={floor} send={send} />
      </div>

      {/* ── QUICK SKILLS — top 3 skills inline for combat ref */}
      {skills.length > 0 && (
        <div className="flex-shrink-0 border-b border-hud-border px-4 py-2 flex gap-2 overflow-x-auto">
          {(skills as any[]).slice(0, 4).map((sk: any) => (
            <div key={sk.id} className={`flex-shrink-0 border px-2 py-1 flex items-center gap-2 ${EFFORT_COLOURS[sk.effortType] || EFFORT_COLOURS.basic}`}>
              <span className="font-hud text-xs">{sk.name}</span>
              <span className="font-hud text-xs opacity-60">Lv{sk.level}</span>
            </div>
          ))}
          {skills.length > 4 && (
            <div className="flex-shrink-0 border border-hud-border px-2 py-1 font-hud text-xs text-hud-muted">
              +{skills.length - 4} more →
            </div>
          )}
        </div>
      )}

      {/* ── REFERENCE — scrollable ────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

        {/* Stats — compact row */}
        <div>
          <div className="font-hud text-xs text-hud-muted tracking-widest mb-2">STATS</div>
          <div className="grid grid-cols-5 gap-1.5">
            {STATS.map(stat => (
              <div key={stat} className="border border-hud-border py-2 text-center">
                <div className="font-hud text-xs text-hud-muted">{stat}</div>
                <div className="font-hud text-lg text-hud-text">{(stats as any)[stat] ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Party status */}
        <PartySidebar characters={allCharacters} myCharId={character.id} onInspect={onInspect} />
      </div>
    </div>
  )
}
