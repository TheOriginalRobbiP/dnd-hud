import { effortColour } from '../../utils/colours'
import type { Character } from '../../types'
import { useState } from 'react'


export function SkillsTab({ character }: { character: Character }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setExpanded(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Class / Race */}
      <div className="flex gap-3">
        {['class','race'].map(field => (
          <div key={field} className="flex-1 border border-hud-border p-2">
            <div className="font-hud text-sm text-hud-muted tracking-wider">{field.toUpperCase()}</div>
            {(character as any)[field]
              ? <div className="font-hud text-sm text-hud-accent mt-1">{(character as any)[field]}</div>
              : <div className="font-hud text-sm text-hud-muted mt-1 italic">🔒 FLOOR 3 UNLOCK</div>
            }
          </div>
        ))}
      </div>

      {/* Skills list */}
      <div>
        <div className="font-hud text-sm text-hud-muted tracking-widest border-b border-hud-border pb-1 mb-3">SKILLS</div>
        {character.skills.length === 0
          ? <p className="font-hud text-sm text-hud-muted italic">No skills registered. The System is disappointed.</p>
          : <div className="flex flex-col gap-2">
              {character.skills.map((s: any) => (
                <div key={s.id} onClick={() => toggle(s.id)}
                  className="border border-hud-border p-2 cursor-pointer hover:border-hud-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-hud text-sm text-hud-text">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-hud text-sm px-1 border"
                        style={{ borderColor: effortColour(s.effortType), color: effortColour(s.effortType) }}>
                        {s.effortType.toUpperCase()}
                      </span>
                      <span className="font-hud text-sm text-hud-muted">LVL {String(s.level).padStart(2,'0')}</span>
                    </div>
                  </div>
                  {expanded.has(s.id) && s.description && (
                    <div className="font-hud text-sm text-hud-muted mt-2 border-t border-hud-border pt-2">{s.description}</div>
                  )}
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}
