import type { Character } from '../../types'
import { useState } from 'react'

const EFFORT_STYLES: Record<string, { border: string; text: string; label: string }> = {
  basic:    { border: 'border-hud-border',  text: 'text-hud-muted',  label: 'BASIC'    },
  weapon:   { border: 'border-red-800',     text: 'text-red-400',    label: 'WEAPON'   },
  magic:    { border: 'border-cyan-800',    text: 'text-cyan-400',   label: 'MAGIC'    },
  ultimate: { border: 'border-yellow-700',  text: 'text-yellow-400', label: 'ULTIMATE' },
}

const STATS = ['STR', 'DEX', 'CON', 'INT', 'CHA'] as const
const STAT_LABELS: Record<string, string> = {
  STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution', INT: 'Intelligence', CHA: 'Charisma'
}

function LevelPips({ level, max = 15 }: { level: number; max?: number }) {
  // Show 10 pips — filled up to level
  const pips = Math.min(10, max)
  return (
    <div className="flex gap-0.5 mt-1">
      {Array.from({ length: pips }).map((_, i) => (
        <div key={i} className={`h-1.5 flex-1 ${i < level ? 'bg-hud-accent' : 'bg-hud-border'}`} />
      ))}
      {level > 10 && (
        <span className="font-hud text-xs text-hud-accent ml-1">{level}</span>
      )}
    </div>
  )
}

export function SkillsTab({ character }: { character: Character }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showHandbook, setShowHandbook] = useState(false)
  const toggle = (id: string) => setExpanded(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  // Group by effort type for clarity
  const grouped = (['weapon','magic','ultimate','basic'] as const).reduce((acc, type) => {
    const skills = (character.skills as any[]).filter(s => s.effortType === type)
    if (skills.length) acc.push({ type, skills })
    return acc
  }, [] as { type: string; skills: any[] }[])

  const getModStr = (score: number) => {
    const mod = score - 4
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  return (
    <div className="p-4 flex flex-col gap-5">

      {/* Primary Stats Grid */}
      <div>
        <div className="font-hud text-xs text-hud-muted tracking-widest mb-2 uppercase">PRIMARY ATTRIBUTES</div>
        <div className="grid grid-cols-5 gap-1.5">
          {STATS.map(stat => {
            const val = (character.stats as any)[stat] ?? 4
            const modStr = getModStr(val)
            return (
              <div key={stat} className="border border-hud-border py-2 text-center bg-hud-panel">
                <div className="font-hud text-[10px] text-hud-muted uppercase" title={STAT_LABELS[stat]}>{stat}</div>
                <div className="font-hud text-sm text-hud-text font-bold mt-0.5">{val}</div>
                <div className="font-hud text-xs text-hud-accent font-extrabold mt-0.5" title="Roll Modifier">{modStr}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* System Handbook — Collapsible Guide */}
      <div className="border border-hud-border bg-hud-panel/20 rounded">
        <button
          onClick={() => setShowHandbook(!showHandbook)}
          className="w-full flex justify-between items-center px-3 py-2 font-hud text-xs text-hud-muted hover:text-hud-accent transition-colors"
        >
          <span>📜 SYSTEM HANDBOOK — HOW TO ACTION</span>
          <span>{showHandbook ? '▲' : '▼'}</span>
        </button>
        {showHandbook && (
          <div className="border-t border-hud-border p-3 text-xs text-hud-muted space-y-2.5 leading-relaxed bg-hud-panel/40">
            <div>
              <span className="text-hud-accent font-bold">1. Action Checks (d20)</span>
              <p className="mt-0.5">Meet or beat the GM's Room Target. Roll: <strong className="text-hud-text font-mono">d20 + Stat Modifier + Skill Level</strong>.</p>
            </div>
            <div className="border-t border-hud-border/40 pt-2">
              <span className="text-hud-accent font-bold">2. Applying Effort (Damage/Progress)</span>
              <p className="mt-0.5">If your Action Check succeeds, roll your associated Effort Dice + Stat Modifier to deplete enemy Hearts:</p>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5 font-mono text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400 font-bold w-5">D4</span>
                  <span>BASIC (Wits/Hands)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-red-400 font-bold w-5">D6</span>
                  <span>WEAPON (Melee/Force)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-400 font-bold w-5">D8</span>
                  <span>GUNS (Ranged)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-400 font-bold w-5">D10</span>
                  <span>MAGIC (Spells)</span>
                </div>
              </div>
              <p className="mt-1.5 text-[10px] italic">A Natural 20 on your check adds a bonus <strong className="text-hud-accent font-mono">D12 (Ultimate Effort)</strong> to your roll!</p>
            </div>
          </div>
        )}
      </div>

      {/* Class / Race — compact */}
      <div className="flex gap-2">
        {['class','race'].map(field => (
          <div key={field} className="flex-1 border border-hud-border px-3 py-2 bg-hud-panel">
            <div className="font-hud text-xs text-hud-muted tracking-wider">{field.toUpperCase()}</div>
            {(character as any)[field]
              ? <div className="font-hud text-sm text-hud-accent mt-0.5">{(character as any)[field]}</div>
              : <div className="font-hud text-xs text-hud-muted mt-0.5 italic">🔒 Floor 3</div>
            }
          </div>
        ))}
      </div>

      {/* Skills grouped by effort type */}
      {character.skills.length === 0
        ? <p className="font-hud text-sm text-hud-muted italic">No skills registered. The System is disappointed.</p>
        : grouped.map(({ type, skills }) => {
            const style = EFFORT_STYLES[type] ?? EFFORT_STYLES.basic
            return (
              <div key={type}>
                <div className={`font-hud text-xs tracking-widest border-b pb-1 mb-2 ${style.border} ${style.text}`}>
                  {style.label}
                </div>
                <div className="flex flex-col gap-2">
                  {skills.map((s: any) => (
                    <div key={s.id} onClick={() => toggle(s.id)}
                      className={`border px-3 py-2 cursor-pointer bg-hud-panel transition-colors ${expanded.has(s.id) ? style.border : 'border-hud-border hover:border-hud-accent'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-hud text-sm text-hud-text leading-tight font-bold">{s.name}</span>
                        <span className={`font-hud text-xs flex-shrink-0 mt-0.5 ${style.text}`}>Lv {s.level}</span>
                      </div>
                      <LevelPips level={s.level} />
                      {s.level >= 15 && s.specialisation && (
                        <div className="font-hud text-xs text-yellow-400 mt-1">✦ {s.specialisation}</div>
                      )}
                      {expanded.has(s.id) && (
                        <div className="font-hud text-xs text-hud-muted mt-2 pt-2 border-t border-hud-border/40 leading-relaxed flex flex-col gap-2">
                          {s.description && <p className="italic">{s.description}</p>}
                          <div className="bg-hud-bg/50 border border-hud-border/30 p-2.5 rounded flex flex-col gap-1 text-[11px]">
                            <div className="text-hud-accent font-bold uppercase tracking-wider text-[9px] mb-0.5">Wetware Roll Calculations:</div>
                            {(() => {
                              const strVal = character.stats.STR ?? 4
                              const dexVal = character.stats.DEX ?? 4
                              const intVal = character.stats.INT ?? 4
                              const chaVal = character.stats.CHA ?? 4
                              
                              let checkStr = ""
                              let effortStr = ""

                              if (type === 'weapon') {
                                const higherVal = Math.max(strVal, dexVal)
                                const higherStat = strVal >= dexVal ? 'STR' : 'DEX'
                                const mod = higherVal - 4
                                checkStr = `d20 + ${higherStat} (${mod >= 0 ? '+' : ''}${mod}) + Skill (${s.level}) = d20 + ${mod + s.level}`
                                effortStr = `1d6 (Weapon Dice) + ${higherStat} (${mod >= 0 ? '+' : ''}${mod})`
                              } else if (type === 'magic') {
                                const mod = intVal - 4
                                checkStr = `d20 + INT (${mod >= 0 ? '+' : ''}${mod}) + Skill (${s.level}) = d20 + ${mod + s.level}`
                                effortStr = `1d10 (Magic Dice) + INT (${mod >= 0 ? '+' : ''}${mod})`
                              } else {
                                // basic / ultimate
                                const mod = Math.max(strVal, dexVal, intVal, chaVal) - 4
                                const bestStat = strVal - 4 === mod ? 'STR' : dexVal - 4 === mod ? 'DEX' : intVal - 4 === mod ? 'INT' : 'CHA'
                                checkStr = `d20 + ${bestStat} (${mod >= 0 ? '+' : ''}${mod}) + Skill (${s.level}) = d20 + ${mod + s.level}`
                                effortStr = `1d4 (Basic Dice) + ${bestStat} (${mod >= 0 ? '+' : ''}${mod})`
                              }

                              return (
                                <div className="space-y-1 font-mono">
                                  <div className="flex justify-between items-center">
                                    <span className="text-hud-muted text-[10px]">Action Check:</span>
                                    <span className="text-hud-text font-bold">{checkStr}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-hud-muted text-[10px]">Effort Roll:</span>
                                    <span className="text-hud-text font-bold">{effortStr}</span>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
      }
    </div>
  )
}
