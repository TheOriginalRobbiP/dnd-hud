import type { Character } from '../../types'
import { getCrawlerPortrait } from '../../utils/portraits'
import { getModifiedCharacter } from '../../utils/modifiers'

const EFFORT_COLOURS: Record<string, string> = {
  basic:   'border-hud-border text-hud-muted',
  weapon:  'border-red-900 text-red-400',
  magic:   'border-cyan-900 text-cyan-400',
  ultimate:'border-yellow-700 text-yellow-400',
}

const SLOTS = [
  ['head','HEAD'], ['face','FACE'], ['neck','NECK'], ['chest','CHEST'],
  ['nipples','NIPPLES'], ['arms','ARMS'], ['hands','HANDS'], ['fingers','FINGERS'],
  ['legs','LEGS'], ['feet','FEET'], ['toes','TOES'],
  ['mainHand','MAIN HAND'], ['offHand','OFF HAND'],
] as const

interface InspectModalProps {
  character: Character
  onClose: () => void
  // If true, hide notes (player viewing another player — no GM notes visible)
  hideNotes?: boolean
}

export function InspectModal({ character: rawCharacter, onClose, hideNotes = false }: InspectModalProps) {
  const character = getModifiedCharacter(rawCharacter)
  const { crawlerName, playerName, hp, maxHp, mp, maxMp, stats, skills, equipment, inventory, notes } = character
  const portrait = getCrawlerPortrait(crawlerName, character.portrait)

  const equippedSlots = SLOTS.filter(([key]) => (equipment as any)[key] !== null && (equipment as any)[key] !== undefined)
  const carriedItems = inventory.filter(item => !item.isEquipped)

  return (
    <div className="fixed inset-0 bg-hud-bg/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-hud-panel border border-hud-border w-full max-w-2xl flex flex-col overflow-hidden rounded-xl"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header — portrait + name */}
        <div className="flex items-center justify-between border-b border-hud-border flex-shrink-0">
          {portrait && (
            <div className="w-16 h-20 flex-shrink-0 overflow-hidden border-r border-hud-border bg-black/20">
              <img src={portrait} alt={crawlerName} className="w-full h-full object-contain object-center" />
            </div>
          )}
          <div className="flex-1 px-4 py-3">
            <div className="font-hud text-hud-accent tracking-widest">{crawlerName.toUpperCase()}</div>
            <div className="font-hud text-sm text-hud-muted">{playerName} · HP {hp}/{maxHp}{maxMp > 0 ? ` · MP ${mp}/${maxMp}` : ''}</div>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="font-hud text-hud-muted hover:text-hp-low px-4 py-4 text-lg self-start">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-5">

          {/* Stats row */}
          <div>
            <div className="font-hud text-xs text-hud-muted tracking-widest mb-2">STATS</div>
            <div className="grid grid-cols-5 gap-2">
              {(['STR','DEX','CON','INT','CHA'] as const).map(s => {
                const val = (stats as any)[s] ?? '—'
                const baseVal = (rawCharacter.stats as any)[s] ?? '—'
                const diff = typeof val === 'number' && typeof baseVal === 'number' ? val - baseVal : 0
                let valColor = 'text-hud-text'
                let diffStr = ''
                if (diff > 0) {
                  valColor = 'text-green-400 font-bold'
                  diffStr = `(+${diff})`
                } else if (diff < 0) {
                  valColor = 'text-red-400 font-bold'
                  diffStr = `(${diff})`
                }

                return (
                  <div key={s} className="border border-hud-border p-2 text-center rounded bg-hud-panel/40">
                    <div className="font-hud text-xs text-hud-muted">{s}</div>
                    <div className={`font-hud text-base font-bold ${valColor}`}>
                      {val} <span className="text-[10px] font-normal">{diffStr}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Skills */}
          <div>
            <div className="font-hud text-xs text-hud-muted tracking-widest mb-2">SKILLS</div>
            <div className="flex flex-col gap-1.5">
              {skills.length === 0
                ? <p className="font-hud text-sm text-hud-muted italic">No skills catalogued.</p>
                : skills.map((sk: any) => {
                    const baseSkill = rawCharacter.skills.find((bs: any) => bs.id === sk.id)
                    const baseLevel = baseSkill?.level ?? sk.level
                    const diff = sk.level - baseLevel
                    let levelColor = 'text-hud-accent'
                    let diffStr = ''
                    if (diff > 0) {
                      levelColor = 'text-green-400 font-bold'
                      diffStr = ` (+${diff})`
                    }

                    return (
                      <div key={sk.id} className={`border px-3 py-2 flex justify-between items-start gap-3 rounded bg-hud-panel/40 ${
                        sk.isGranted ? 'border-yellow-700/50 bg-yellow-950/5' : 'border-hud-border'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-hud text-sm text-hud-text font-bold">{sk.name}</span>
                            {sk.isGranted && (
                              <span className="font-hud text-[8px] border border-yellow-700 text-yellow-400 px-1 font-bold bg-yellow-950/20 rounded-sm leading-none py-0.5 uppercase tracking-wider shrink-0">
                                ✦ GEAR
                              </span>
                            )}
                          </div>
                          <div className="font-hud text-xs text-hud-muted mt-0.5 leading-relaxed">{sk.description}</div>
                          {sk.isGranted && (
                            <div className="font-hud text-[10px] text-yellow-500/80 italic mt-1">
                              Granted by equipped: {sk.grantedBy}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <div className={`font-hud text-sm ${levelColor}`}>Lv {sk.level}{diffStr}</div>
                          <div className={`font-hud text-[10px] border px-1.5 rounded-sm ${EFFORT_COLOURS[sk.effortType] || EFFORT_COLOURS.basic}`}>
                            {sk.effortType.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          </div>

          {/* Equipped items */}
          <div>
            <div className="font-hud text-xs text-hud-muted tracking-widest mb-2">EQUIPPED</div>
            {equippedSlots.length === 0
              ? <p className="font-hud text-sm text-hud-muted italic">Nothing equipped.</p>
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {equippedSlots.map(([key, label]) => {
                    const item = (equipment as any)[key]
                    return (
                      <div key={key} className="border border-hud-border px-3 py-2 flex gap-3 rounded bg-hud-panel/40">
                        <div className="font-hud text-xs text-hud-muted w-20 flex-shrink-0 pt-0.5">{label}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-hud text-sm text-hud-text font-bold">{item.name}</div>
                          <div className="font-hud text-xs text-hud-muted mt-0.5 leading-relaxed">{item.description}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </div>

          {/* Carried items */}
          {carriedItems.length > 0 && (
            <div>
              <div className="font-hud text-xs text-hud-muted tracking-widest mb-2">CARRIED</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {carriedItems.map((item: any) => (
                  <div key={item.id} className="border border-hud-border px-3 py-2 rounded bg-hud-panel/10">
                    <div className="font-hud text-sm text-hud-text font-bold">{item.name}</div>
                    <div className="font-hud text-xs text-hud-muted mt-0.5 leading-relaxed">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes (GM view only) */}
          {notes && !hideNotes && (
            <div className="border-t border-hud-border pt-4">
              <div className="font-hud text-xs text-hud-muted tracking-widest mb-2">GM NOTES</div>
              <p className="font-hud text-xs text-hud-muted italic bg-hud-panel/20 p-3 border border-hud-border/40 rounded whitespace-pre-wrap leading-relaxed">{notes}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}