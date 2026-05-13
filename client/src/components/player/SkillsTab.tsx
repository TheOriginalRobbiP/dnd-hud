import type { Character } from '../../types'
import { useState } from 'react'

const EFFORT_STYLES: Record<string, { border: string; text: string; label: string }> = {
  basic:    { border: 'border-hud-border',  text: 'text-hud-muted',  label: 'BASIC'    },
  weapon:   { border: 'border-red-800',     text: 'text-red-400',    label: 'WEAPON'   },
  magic:    { border: 'border-cyan-800',    text: 'text-cyan-400',   label: 'MAGIC'    },
  ultimate: { border: 'border-yellow-700',  text: 'text-yellow-400', label: 'ULTIMATE' },
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
  const toggle = (id: string) => setExpanded(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  // Group by effort type for clarity
  const grouped = (['weapon','magic','ultimate','basic'] as const).reduce((acc, type) => {
    const skills = (character.skills as any[]).filter(s => s.effortType === type)
    if (skills.length) acc.push({ type, skills })
    return acc
  }, [] as { type: string; skills: any[] }[])

  return (
    <div className="p-4 flex flex-col gap-5">

      {/* Class / Race — compact */}
      <div className="flex gap-2">
        {['class','race'].map(field => (
          <div key={field} className="flex-1 border border-hud-border px-3 py-2">
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
                      className={`border px-3 py-2 cursor-pointer transition-colors ${expanded.has(s.id) ? style.border : 'border-hud-border hover:border-hud-accent'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-hud text-sm text-hud-text leading-tight">{s.name}</span>
                        <span className={`font-hud text-xs flex-shrink-0 mt-0.5 ${style.text}`}>Lv {s.level}</span>
                      </div>
                      <LevelPips level={s.level} />
                      {s.level >= 15 && s.specialisation && (
                        <div className="font-hud text-xs text-yellow-400 mt-1">✦ {s.specialisation}</div>
                      )}
                      {expanded.has(s.id) && s.description && (
                        <div className="font-hud text-xs text-hud-muted mt-2 pt-2 border-t border-hud-border leading-relaxed">
                          {s.description}
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
