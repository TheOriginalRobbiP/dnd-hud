import { useState, useEffect, useCallback } from 'react'

interface MobTemplate {
  id: string
  campaignId: string | null
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
  campaign?: any
  onSpawn: (mob: { name: string; hp: number; maxHp: number; effortType: string; notes: string }) => void
  onClose: () => void
}

function rollHp(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function BestiaryPicker({ currentFloor, campaign, onSpawn, onClose }: BestiaryPickerProps) {
  const campaignId = campaign?.id || '00000000-0000-0000-0000-000000000000'
  const [mobs, setMobs] = useState<MobTemplate[]>([])
  const [search, setSearch] = useState('')
  const [floor, setFloor] = useState(String(currentFloor))
  const [filter, setFilter] = useState<'all' | 'elite' | 'boss'>('all')
  const [selected, setSelected] = useState<MobTemplate | null>(null)
  const [loading, setLoading] = useState(false)

  // Creation & Editing states
  const [isCreating, setIsCreating] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formHpMin, setFormHpMin] = useState(5)
  const [formHpMax, setFormHpMax] = useState(10)
  const [formEffortType, setFormEffortType] = useState('basic')
  const [formFloor, setFormFloor] = useState(currentFloor)
  const [formIsElite, setFormIsElite] = useState(false)
  const [formIsBoss, setFormIsBoss] = useState(false)
  const [formAbilities, setFormAbilities] = useState('')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('campaignId', campaignId)
      if (search) params.set('q', search)
      if (floor) params.set('floor', floor)
      if (filter === 'elite') params.set('elite', 'true')
      if (filter === 'boss') params.set('boss', 'true')
      const res = await fetch(`/api/mobs?${params}`)
      setMobs(await res.json())
    } finally {
      setLoading(false)
    }
  }, [campaignId, search, floor, filter])

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

  const startCreate = () => {
    setFormName('')
    setFormDescription('')
    setFormHpMin(5)
    setFormHpMax(10)
    setFormEffortType('basic')
    setFormFloor(currentFloor)
    setFormIsElite(false)
    setFormIsBoss(false)
    setFormAbilities('')
    setIsCreating(true)
  }

  const saveMob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      hpMin: formHpMin,
      hpMax: formHpMax,
      effortType: formEffortType,
      floor: formFloor,
      isElite: formIsElite,
      isBoss: formIsBoss,
      abilities: formAbilities.trim(),
    }

    try {
      const res = await fetch(`/api/mobs?campaignId=${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const created = await res.json()
        setMobs(prev => [...prev, created])
        setSelected(created)
        setIsCreating(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteMob = async (mob: MobTemplate) => {
    if (!confirm(`Are you sure you want to completely erase the ${mob.name} template from your campaign bestiary?`)) return
    try {
      const res = await fetch(`/api/mobs/${mob.id}?campaignId=${campaignId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMobs(prev => prev.filter(m => m.id !== mob.id))
        setSelected(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const effortColour = (e: string) => {
    if (e === 'weapon') return 'text-hp-low border-red-900'
    if (e === 'magic') return 'text-hud-accent border-purple-900'
    return 'text-hud-muted border-hud-border'
  }

  return (
    <div className="fixed inset-0 bg-hud-bg/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-hud-panel border border-hud-border w-full max-w-3xl h-[85vh] p-5 flex flex-col gap-4 shadow-2xl rounded-lg" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-hud-border pb-3">
          <div>
            <div className="font-hud text-hud-accent tracking-widest text-sm font-bold uppercase">📖 SYSTEM BESTIARY VAULTS</div>
            <p className="text-[10px] text-hud-muted tracking-wider uppercase mt-0.5">Campaign Mobs Reference & Custom Enemy Spawner</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={startCreate}
              className="font-hud text-xs border border-hud-accent/60 text-hud-accent bg-hud-accent/5 px-2.5 py-1 rounded hover:bg-hud-accent/20 transition-all font-bold uppercase"
            >
              [ + Create Custom Mob ]
            </button>
            <button onClick={onClose} aria-label="Close" className="font-hud text-hud-muted hover:text-hp-low px-2 text-lg">✕</button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-hud-bg/60 p-2 border border-hud-border/40 rounded">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search mobs..."
            className="sm:col-span-2 bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-1.5 focus:border-hud-accent outline-none" />
          
          <select value={floor} onChange={e => setFloor(e.target.value)}
            className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-1.5 focus:border-hud-accent outline-none">
            <option value="">All floors</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
            <option value="3">Floor 3</option>
          </select>

          <div className="flex gap-1">
            {(['all', 'elite', 'boss'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 font-hud text-[10px] py-1.5 border transition-colors tracking-wider rounded uppercase font-bold ${
                  filter === f
                    ? 'border-hud-accent text-hud-accent bg-hud-accent/5'
                    : 'border-hud-border text-hud-muted hover:text-hud-text'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Split Panel */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 overflow-hidden">
          {/* Mobs List */}
          <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-thin border border-hud-border/20 p-2 rounded bg-hud-bg/20">
            {loading && <div className="font-hud text-sm text-hud-muted animate-pulse p-4 text-center">Interrogating Borant telemetry...</div>}
            {!loading && mobs.length === 0 && <div className="font-hud text-sm text-hud-muted italic p-4 text-center">No catalogued threats found.</div>}
            {!loading && mobs.map(m => (
              <button key={m.id} onClick={() => { setSelected(m); setIsCreating(false); }}
                className={`text-left border p-3 rounded transition-all flex flex-col gap-1 ${
                  selected?.id === m.id && !isCreating
                    ? 'border-hud-accent bg-hud-bg/85 shadow-md'
                    : 'border-hud-border/40 hover:border-hud-accent/50 bg-hud-panel/40 hover:bg-hud-panel/70'
                }`}>
                <div className="flex justify-between items-center w-full">
                  <span className="font-hud text-sm text-hud-text font-extrabold uppercase tracking-wide">
                    {m.name} {m.campaignId && <span className="text-hud-accent text-[9px] lowercase font-normal ml-1">#custom</span>}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    {m.isBoss && <span className="font-hud text-[8px] border border-red-900 text-red-500 bg-red-950/10 px-1 py-0.5 rounded font-extrabold">BOSS</span>}
                    {m.isElite && <span className="font-hud text-[8px] border border-hud-accent text-hud-accent bg-hud-accent/5 px-1 py-0.5 rounded font-extrabold">ELITE</span>}
                    <span className={`font-hud text-[8px] border px-1 py-0.5 rounded uppercase font-bold ${effortColour(m.effortType)}`}>{m.effortType}</span>
                  </div>
                </div>
                <div className="font-hud text-xs text-hud-muted leading-relaxed line-clamp-1 italic">
                  {m.description || 'No description catalogued.'}
                </div>
              </button>
            ))}
          </div>

          {/* Details Sidebar / Form */}
          <div className="border border-hud-border bg-hud-bg/30 p-4 rounded-lg flex flex-col justify-between max-h-full overflow-y-auto">
            {isCreating ? (
              /* Custom Mob Creation Form */
              <form onSubmit={saveMob} className="flex flex-col gap-3.5 h-full">
                <div className="border-b border-hud-border pb-1.5 flex justify-between items-center">
                  <h4 className="font-hud text-xs text-hud-accent font-extrabold uppercase">CREATE CUSTOM MONSTER</h4>
                  <button type="button" onClick={() => setIsCreating(false)} className="font-hud text-[10px] text-hud-muted">[ CANCEL ]</button>
                </div>

                <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
                  <div className="flex flex-col gap-1">
                    <label className="font-hud text-[9px] text-hud-muted uppercase font-bold">Monster Name</label>
                    <input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="e.g. Goblin Berserker, Cave Roach"
                      className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-1.5 outline-none focus:border-hud-accent" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-hud text-[9px] text-hud-muted uppercase font-bold">Description</label>
                    <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} placeholder="Physical appearance or traits..."
                      className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1.5 outline-none focus:border-hud-accent resize-none leading-relaxed" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="font-hud text-[9px] text-hud-muted uppercase font-bold">Min HP</label>
                      <input type="number" min={1} value={formHpMin} onChange={e => setFormHpMin(parseInt(e.target.value) || 5)}
                        className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1.5 outline-none focus:border-hud-accent" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-hud text-[9px] text-hud-muted uppercase font-bold">Max HP</label>
                      <input type="number" min={1} value={formHpMax} onChange={e => setFormHpMax(parseInt(e.target.value) || 10)}
                        className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1.5 outline-none focus:border-hud-accent" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="font-hud text-[9px] text-hud-muted uppercase font-bold">Effort Type</label>
                      <select value={formEffortType} onChange={e => setFormEffortType(e.target.value)}
                        className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1.5 outline-none focus:border-hud-accent">
                        <option value="basic">Basic (d4)</option>
                        <option value="weapon">Weapon (d6)</option>
                        <option value="magic">Magic (d10)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-hud text-[9px] text-hud-muted uppercase font-bold">Floor Level</label>
                      <input type="number" min={1} value={formFloor} onChange={e => setFormFloor(parseInt(e.target.value) || 1)}
                        className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1.5 outline-none focus:border-hud-accent" />
                    </div>
                  </div>

                  <div className="flex gap-4 p-1.5 bg-hud-bg border border-hud-border rounded justify-around">
                    <label className="font-hud text-[10px] flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={formIsElite} onChange={e => setFormIsElite(e.target.checked)} className="accent-hud-accent" />
                      Is Elite
                    </label>
                    <label className="font-hud text-[10px] flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={formIsBoss} onChange={e => setFormIsBoss(e.target.checked)} className="accent-hud-accent" />
                      Is Boss
                    </label>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-hud text-[9px] text-hud-muted uppercase font-bold">Notable Attacks / Abilities</label>
                    <input value={formAbilities} onChange={e => setFormAbilities(e.target.value)} placeholder="e.g. Acid Spit (+3), Fire Aura"
                      className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1.5 outline-none focus:border-hud-accent" />
                  </div>
                </div>

                <button type="submit" className="w-full font-hud text-xs bg-hud-accent text-hud-bg py-2.5 rounded font-extrabold uppercase hover:brightness-110 transition-all">
                  ✓ SAVE CUSTOM MOB
                </button>
              </form>
            ) : selected ? (
              /* Selected details card */
              <div className="flex flex-col gap-4 h-full justify-between">
                <div className="flex flex-col gap-4">
                  <div className="border-b border-hud-border pb-2.5">
                    <span className="font-hud text-[8px] border border-hud-border px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase text-hud-muted">
                      FLOOR {selected.floor} MONSTER
                    </span>
                    <h4 className="font-hud text-md text-hud-text font-extrabold uppercase mt-2">{selected.name}</h4>
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-[10px] text-hud-muted">
                    <div className="flex justify-between border-b border-hud-border/10 pb-1">
                      <span>HP SPECS</span>
                      <span className="text-hud-text font-bold">{selected.hpMin}–{selected.hpMax} HP</span>
                    </div>
                    <div className="flex justify-between border-b border-hud-border/10 pb-1">
                      <span>EFFORT SCALE</span>
                      <span className="text-hud-text font-bold uppercase">{selected.effortType}</span>
                    </div>
                  </div>

                  <div className="bg-hud-bg/50 border border-hud-border/40 p-2.5 rounded text-xs text-hud-muted leading-relaxed italic">
                    "{selected.description || 'No system description.'}"
                  </div>

                  {selected.abilities && (
                    <div className="border border-red-900/60 bg-red-950/5 p-2.5 rounded flex flex-col gap-1">
                      <span className="font-hud text-[8px] text-red-400 font-bold tracking-widest uppercase">NOTABLE ABILITIES</span>
                      <p className="font-hud text-xs text-red-200">{selected.abilities}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-hud-border">
                  <button onClick={spawn} className="w-full font-hud text-xs bg-red-700 text-white py-2.5 rounded font-extrabold uppercase hover:bg-red-600 transition-all shadow-md">
                    ⚡ SPAWN IN CURRENT ROOM
                  </button>

                  {selected.campaignId && (
                    <button onClick={() => deleteMob(selected)} className="w-full font-hud text-[10px] text-red-500 hover:text-red-400 py-1 font-bold uppercase border border-transparent hover:border-red-900/40 rounded transition-all">
                      [ DELETE CUSTOM TEMPLATE ]
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Empty details state */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-hud-muted italic border border-dashed border-hud-border/40 rounded-lg">
                <span className="text-2xl mb-1">📖</span>
                <p className="font-hud text-[10px]">Select a monster to roll its starting HP, preview its capabilities, and spawn it, or author custom templates.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
