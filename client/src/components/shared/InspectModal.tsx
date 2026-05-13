import type { Character } from '../../types'

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

export function InspectModal({ character, onClose, hideNotes = false }: InspectModalProps) {
  const { crawlerName, playerName, hp, maxHp, mp, maxMp, stats, skills, equipment, inventory, notes } = character

  const equippedSlots = SLOTS.filter(([key]) => (equipment as any)[key] !== null && (equipment as any)[key] !== undefined)
  const carriedItems = inventory.filter(item => !item.isEquipped)

  return (
    <div className="fixed inset-0 bg-hud-bg/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-hud-panel border border-hud-border w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-hud-border px-5 py-3 flex-shrink-0">
          <div>
            <div className="font-hud text-hud-accent tracking-widest">{crawlerName.toUpperCase()}</div>
            <div className="font-hud text-sm text-hud-muted">{playerName} · HP {hp}/{maxHp}{maxMp > 0 ? ` · MP ${mp}/${maxMp}` : ''}</div>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="font-hud text-hud-muted hover:text-hp-low px-2 text-lg">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-5">

          {/* Stats row */}
          <div>
            <div className="font-hud text-xs text-hud-muted tracking-widest mb-2">STATS</div>
            <div className="grid grid-cols-5 gap-2">
              {(['STR','DEX','CON','INT','CHA'] as const).map(s => (
                <div key={s} className="border border-hud-border p-2 text-center">
                  <div className="font-hud text-xs text-hud-muted">{s}</div>
                  <div className="font-hud text-xl text-hud-text">{(stats as any)[s] ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <div className="font-hud text-xs text-hud-muted tracking-widest mb-2">SKILLS</div>
            <div className="flex flex-col gap-1">
              {skills.length === 0
                ? <p className="font-hud text-sm text-hud-muted italic">No skills catalogued.</p>
                : skills.map((sk: any) => (
                  <div key={sk.id} className="border border-hud-border px-3 py-2 flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-hud text-sm text-hud-text">{sk.name}</div>
                      <div className="font-hud text-xs text-hud-muted mt-0.5 leading-relaxed">{sk.description}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="font-hud text-sm text-hud-accent">Lv {sk.level}</div>
                      <div className={`font-hud text-xs border px-1 ${EFFORT_COLOURS[sk.effortType] || EFFORT_COLOURS.basic}`}>
                        {sk.effortType.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Equipped items */}
          <div>
            <div className="font-hud text-xs text-hud-muted tracking-widest mb-2">EQUIPPED</div>
            {equippedSlots.length === 0
              ? <p className="font-hud text-sm text-hud-muted italic">Nothing equipped.</p>
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {equippedSlots.map(([key, label]) => {
                    const item = (equipment as any)[key]
                    return (
                      <div key={key} className="border border-hud-border px-3 py-2 flex gap-3">
                        <div className="font-hud text-xs text-hud-muted w-20 flex-shrink-0 pt-0.5">{label}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-hud text-sm text-hud-text">{item.name}</div>
                          <div className="font-hud text-xs text-hud-muted mt-0.5">{item.description}</div>
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
              <div className="flex flex-col gap-1">
                {carriedItems.map((item: any) => (
                  <div key={item.id} className="border border-hud-border px-3 py-2 flex justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-hud text-sm text-hud-text">{item.name}</div>
                      <div className="font-hud text-xs text-hud-muted mt-0.5">{item.description}</div>
                    </div>
                    <div className="font-hud text-xs text-hud-muted flex-shrink-0 pt-0.5">{item.tier.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GM notes — hidden when player views another player */}
          {!hideNotes && notes && (
            <div>
              <div className="font-hud text-xs text-hud-muted tracking-widest mb-2">GM NOTES</div>
              <div className="border border-hud-border px-3 py-2 font-hud text-sm text-hud-muted leading-relaxed">
                {notes}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
