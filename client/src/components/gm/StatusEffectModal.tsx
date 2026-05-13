import { useState } from 'react'
import type { WSMessage } from '../../types'

const CANONICAL_EFFECTS = {
  buff: [
    { name: 'Attuned', description: 'Magically attuned to your surroundings.' },
    { name: 'Boon', description: 'The System has smiled upon you. Briefly.' },
    { name: 'Good Rest', description: 'You slept well. Enjoy it while it lasts.' },
    { name: 'Great Rest', description: 'Exceptionally well rested. Suspicious.' },
    { name: 'Juiced', description: 'Something is making you faster and stronger.' },
    { name: 'Magical Fervor', description: 'Spells flow easily. Do not waste this.' },
    { name: 'Soothed', description: 'Calm. Unnervingly so given the circumstances.' },
    { name: 'Trolled', description: 'Regenerating. Viewers find this boring.' },
    { name: 'Unbreakable', description: 'Damage reduction active. Temporary.' },
    { name: 'Vorpal', description: 'Your attacks ignore armour. Use this.' },
  ],
  debuff: [
    { name: 'Bleed', description: 'Taking damage each round. Stop moving.' },
    { name: 'Buzzed', description: 'Alcohol-impaired. Decision-making affected.' },
    { name: 'Fatigued', description: 'Exhausted. All rolls at disadvantage.' },
    { name: 'Frosted', description: 'Ice in your veins. Movement slowed.' },
    { name: 'Knockback', description: 'Pushed away. Repositioning required.' },
    { name: 'Muted', description: 'Cannot cast verbal spells. Frustrating.' },
    { name: 'Paralysis', description: 'Cannot move. Entirely the worst.' },
    { name: 'Poison', description: 'Potion cooldown violated. Rookie mistake.' },
    { name: 'Queasy', description: 'Nauseous. Concentration checks harder.' },
    { name: 'Sepsis', description: 'Infected wound. Worsening.' },
    { name: 'Shit-Faced', description: 'Heavily intoxicated. The audience loves it.' },
    { name: 'Stun', description: 'Cannot act this round.' },
    { name: 'Unconscious', description: 'Down. Someone should probably help.' },
    { name: 'Vigorous Measles', description: 'The dungeon has given you measles.' },
  ],
  mixed: [
    { name: 'Conscription Status', description: 'You have been drafted into something.' },
    { name: 'Divine Intervention', description: 'Something noticed you. Unclear if good.' },
  ],
}

interface StatusEffectModalProps {
  characterId: string
  characterName: string
  currentEffects: any[]
  onClose: () => void
  send: (msg: WSMessage) => void
}

export function StatusEffectModal({ characterId, characterName, currentEffects, onClose, send }: StatusEffectModalProps) {
  const [type, setType] = useState<'buff' | 'debuff' | 'mixed'>('debuff')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<{ name: string; description: string } | null>(null)
  const [customName, setCustomName] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [duration, setDuration] = useState('')
  const [permanent, setPermanent] = useState(false)
  const [isCustom, setIsCustom] = useState(false)

  const effects = CANONICAL_EFFECTS[type].filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const apply = () => {
    const name = isCustom ? customName.trim() : selected?.name
    const description = isCustom ? customDesc.trim() : selected?.description ?? ''
    if (!name) return
    send({
      type: 'status_effect_add',
      charId: characterId,
      effect: {
        id: crypto.randomUUID(),
        name,
        type,
        description,
        duration: permanent ? null : (parseInt(duration) || null),
        isCustom,
      }
    })
    setSelected(null); setCustomName(''); setCustomDesc(''); setDuration(''); setSearch('')
  }

  const remove = (effectId: string) => {
    send({ type: 'status_effect_remove', charId: characterId, effectId })
  }

  const typeColour = { buff: 'text-green-400 border-green-800', debuff: 'text-hp-low border-red-900', mixed: 'text-hud-cyan border-hud-cyan' }

  return (
    <div className="fixed inset-0 bg-hud-bg/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-hud-panel border border-hud-border w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <div className="font-hud text-hud-accent tracking-widest text-sm">STATUS EFFECTS — {characterName.toUpperCase()}</div>
          <button onClick={onClose} aria-label="Close" className="font-hud text-hud-muted hover:text-hp-low transition-colors px-2">✕</button>
        </div>

        {/* Active effects */}
        {currentEffects.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="font-hud text-xs text-hud-muted tracking-widest mb-1">ACTIVE</div>
            {currentEffects.map((e: any) => (
              <div key={e.id} className={`flex justify-between items-center border px-3 py-2 ${typeColour[e.type as keyof typeof typeColour]}`}>
                <div>
                  <span className="font-hud text-sm">{e.name}</span>
                  {e.duration && <span className="font-hud text-xs text-hud-muted ml-2">{e.duration}r</span>}
                </div>
                <button onClick={() => remove(e.id)} aria-label={`Remove ${e.name}`}
                  className="font-hud text-sm text-hud-muted hover:text-hp-low transition-colors px-2">✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Type toggle */}
        <div className="flex gap-2">
          {(['buff','debuff','mixed'] as const).map(t => (
            <button key={t} onClick={() => { setType(t); setSelected(null); setIsCustom(false) }}
              className={`flex-1 font-hud text-sm py-2 border transition-colors tracking-wider ${
                type === t
                  ? t === 'buff' ? 'border-green-600 text-green-400' : t === 'debuff' ? 'border-red-700 text-hp-low' : 'border-hud-cyan text-hud-cyan'
                  : 'border-hud-border text-hud-muted'
              }`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search effects..."
          className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />

        {/* Effect list */}
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {effects.map(e => (
            <button key={e.name} onClick={() => { setSelected(e); setIsCustom(false) }}
              className={`text-left border px-3 py-2 font-hud text-sm transition-colors ${
                selected?.name === e.name ? 'border-hud-accent text-hud-text bg-hud-bg' : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-text'
              }`}>
              <div>{e.name}</div>
              <div className="text-xs text-hud-muted mt-0.5 italic">{e.description}</div>
            </button>
          ))}
          <button onClick={() => { setIsCustom(true); setSelected(null) }}
            className={`text-left border px-3 py-2 font-hud text-sm transition-colors ${isCustom ? 'border-hud-accent text-hud-text' : 'border-hud-border text-hud-muted hover:border-hud-accent'}`}>
            + Custom effect...
          </button>
        </div>

        {/* Custom fields */}
        {isCustom && (
          <div className="flex flex-col gap-2">
            <input value={customName} onChange={e => setCustomName(e.target.value)}
              placeholder="Effect name..."
              className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
            <input value={customDesc} onChange={e => setCustomDesc(e.target.value)}
              placeholder="Description..."
              className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
          </div>
        )}

        {/* Duration */}
        {(selected || isCustom) && (
          <div className="flex gap-3 items-center">
            <input value={duration} onChange={e => setDuration(e.target.value)}
              disabled={permanent} placeholder="Rounds..." type="number" min="1"
              className="w-28 bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none disabled:opacity-40" />
            <label className="flex items-center gap-2 font-hud text-sm text-hud-muted cursor-pointer">
              <input type="checkbox" checked={permanent} onChange={e => setPermanent(e.target.checked)}
                className="accent-hud-accent" />
              Permanent
            </label>
          </div>
        )}

        {/* Apply */}
        {(selected || (isCustom && customName)) && (
          <button onClick={apply}
            className="border border-hud-accent text-hud-accent font-hud text-sm py-3 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-wider">
            APPLY EFFECT
          </button>
        )}
      </div>
    </div>
  )
}
