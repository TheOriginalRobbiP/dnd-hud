import { useState, useEffect, useCallback } from 'react'

interface Item {
  id: string
  campaignId: string | null
  name: string
  description: string
  tier: string
  lootBoxTier: string | null
  slot: string | null
  effortType: string | null
  skillBonus: string | null
  floorFound: number
  isConsumable: boolean
  tags: string
}

export function ItemDatabasePanel({ campaign }: { campaign?: any }) {
  const campaignId = campaign?.id || '00000000-0000-0000-0000-000000000000'
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('')
  const [slot, setSlot] = useState('')
  const [floor, setFloor] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Item | null>(null)

  // CRUD & Creation states
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTier, setFormTier] = useState('common')
  const [formSlot, setFormSlot] = useState('')
  const [formEffortType, setFormEffortType] = useState('')
  const [formSkillBonus, setFormSkillBonus] = useState('')
  const [formFloorFound, setFormFloorFound] = useState(1)
  const [formIsConsumable, setFormIsConsumable] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('campaignId', campaignId)
      if (search) params.set('q', search)
      if (tier) params.set('tier', tier)
      if (slot) params.set('slot', slot)
      if (floor) params.set('floor', floor)
      const res = await fetch(`/api/items?${params}`)
      setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }, [campaignId, search, tier, slot, floor])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const startCreate = () => {
    setFormName('')
    setFormDescription('')
    setFormTier('common')
    setFormSlot('')
    setFormEffortType('')
    setFormSkillBonus('')
    setFormFloorFound(1)
    setFormIsConsumable(false)
    setIsCreating(true)
    setIsEditing(false)
  }

  const startEdit = (item: Item) => {
    setFormName(item.name)
    setFormDescription(item.description)
    setFormTier(item.tier.toLowerCase())
    setFormSlot(item.slot || '')
    setFormEffortType(item.effortType || '')
    setFormSkillBonus(item.skillBonus || '')
    setFormFloorFound(item.floorFound)
    setFormIsConsumable(item.isConsumable)
    setIsEditing(true)
    setIsCreating(false)
  }

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      tier: formTier,
      slot: formSlot || null,
      effortType: formEffortType || null,
      skillBonus: formSkillBonus.trim() || null,
      floorFound: formFloorFound,
      isConsumable: formIsConsumable,
    }

    try {
      if (isCreating) {
        const res = await fetch(`/api/items?campaignId=${campaignId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const created = await res.json()
          setItems(prev => [...prev, created])
          setSelected(created)
          setIsCreating(false)
        }
      } else if (isEditing && selected) {
        const res = await fetch(`/api/items/${selected.id}?campaignId=${campaignId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const updated = await res.json()
          setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
          setSelected(updated)
          setIsEditing(false)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteItem = async (item: Item) => {
    if (!confirm(`Are you sure you want to completely erase ${item.name} from your campaign database?`)) return
    try {
      const res = await fetch(`/api/items/${item.id}?campaignId=${campaignId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== item.id))
        setSelected(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const TIER_COLOURS: Record<string, string> = {
    common: '#64748b',
    uncommon: '#22c55e',
    rare: '#60a5fa',
    legendary: '#a855f7',
    celestial: '#f59e0b',
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-hud-bg p-4 md:p-6 pb-16 md:pb-0">
      {/* Header Info */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="font-hud text-base text-hud-accent tracking-widest font-bold uppercase">📦 BORANT CORP CENTRAL ITEM BANK</h3>
          <p className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mt-0.5">
            Global Item Catalogue & Campaign Custom Asset Builder
          </p>
        </div>
        <button
          onClick={startCreate}
          className="font-hud text-xs border border-hud-accent text-hud-accent bg-hud-accent/5 px-3 py-1.5 rounded uppercase hover:bg-hud-accent/20 transition-all font-bold"
        >
          [ + CREATE ITEM ]
        </button>
      </div>

      {/* Search Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-hud-panel border border-hud-border p-3 rounded-lg mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search item name or description..."
          className="sm:col-span-2 bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
        />

        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
        >
          <option value="">All Tiers</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="legendary">Legendary</option>
          <option value="celestial">Celestial</option>
        </select>

        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
        >
          <option value="">All Slots</option>
          <option value="head">Head</option>
          <option value="face">Face</option>
          <option value="neck">Neck</option>
          <option value="chest">Chest</option>
          <option value="nipples">Nipples</option>
          <option value="arms">Arms</option>
          <option value="hands">Hands</option>
          <option value="fingers">Fingers</option>
          <option value="legs">Legs</option>
          <option value="feet">Feet</option>
          <option value="toes">Toes</option>
          <option value="mainHand">Main Hand</option>
          <option value="offHand">Off Hand</option>
        </select>

        <select
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
        >
          <option value="">All Floors</option>
          <option value="1">Floor 1</option>
          <option value="2">Floor 2</option>
          <option value="3">Floor 3</option>
        </select>
      </div>

      {/* Main Grid: List on Left, Detail Card on Right */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-4 overflow-hidden">
        {/* Item List */}
        <div className="flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin border border-hud-border/30 rounded-lg p-2 bg-hud-panel/10">
          {loading && (
            <div className="font-hud text-sm text-hud-muted animate-pulse p-4 text-center">
              Scanning corporate database vaults...
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="font-hud text-sm text-hud-muted italic p-4 text-center">
              No matching items found. Locate a merchant or update filter.
            </div>
          )}
          {!loading &&
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelected(item)
                  setIsCreating(false)
                  setIsEditing(false)
                }}
                className={`text-left border p-3.5 transition-all rounded-md ${
                  selected?.id === item.id && !isCreating && !isEditing
                    ? 'border-hud-accent bg-hud-bg/80 shadow-md'
                    : 'border-hud-border/40 hover:border-hud-accent/60 bg-hud-panel/20 hover:bg-hud-panel/40'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-hud text-sm text-hud-text font-bold uppercase tracking-wider break-words min-w-0 flex-1">
                    {item.name} {item.campaignId && <span className="text-hud-accent text-[10px] lowercase font-normal ml-1">#custom</span>}
                  </span>
                  <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    <span
                      className="font-hud text-[9px] px-1.5 py-0.5 border rounded-sm font-bold uppercase"
                      style={{
                        borderColor: TIER_COLOURS[item.tier.toLowerCase()] || '#64748b',
                        color: TIER_COLOURS[item.tier.toLowerCase()] || '#64748b',
                        backgroundColor: `${TIER_COLOURS[item.tier.toLowerCase()]}0a`,
                      }}
                    >
                      {item.tier}
                    </span>
                    {item.isConsumable && (
                      <span className="font-hud text-[9px] text-cyan-400 border border-cyan-900/60 bg-cyan-950/5 px-1.5 py-0.5 rounded-sm font-bold">
                        CONSUMABLE
                      </span>
                    )}
                    {item.slot && !item.isConsumable && (
                      <span className="font-hud text-[9px] text-hud-muted border border-hud-border/40 px-1.5 py-0.5 rounded-sm uppercase font-mono">
                        {item.slot}
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-hud text-xs text-hud-muted mt-1.5 leading-relaxed line-clamp-2">
                  {item.description || 'No description provided by the System.'}
                </div>
              </button>
            ))}
        </div>

        {/* Selected Item Detail Sidebar / Edit Form */}
        <div className="border border-hud-border bg-hud-panel p-5 rounded-lg flex flex-col justify-between max-h-full overflow-y-auto shadow-2xl">
          {isCreating || isEditing ? (
            /* Creation & Editing Form */
            <form onSubmit={saveItem} className="flex flex-col gap-4 h-full">
              <div className="border-b border-hud-border pb-2 flex justify-between items-center">
                <h4 className="font-hud text-sm text-hud-accent font-extrabold uppercase">
                  {isCreating ? 'CREATE CUSTOM ITEM' : 'EDIT CUSTOM ITEM'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false)
                    setIsEditing(false)
                  }}
                  className="font-hud text-xs text-hud-muted hover:text-hud-text"
                >
                  [ CANCEL ]
                </button>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                <div className="flex flex-col gap-1">
                  <label className="font-hud text-[10px] text-hud-muted uppercase font-bold">Item Name</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Poisoned Dagger, Healing Pill"
                    className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 outline-none focus:border-hud-accent"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-hud text-[10px] text-hud-muted uppercase font-bold">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    placeholder="Enter visual or narrative description..."
                    className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-2 outline-none focus:border-hud-accent resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-hud text-[10px] text-hud-muted uppercase font-bold">Rarity Tier</label>
                    <select
                      value={formTier}
                      onChange={(e) => setFormTier(e.target.value)}
                      className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-2 outline-none focus:border-hud-accent"
                    >
                      <option value="common">Common</option>
                      <option value="uncommon">Uncommon</option>
                      <option value="rare">Rare</option>
                      <option value="legendary">Legendary</option>
                      <option value="celestial">Celestial</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-hud text-[10px] text-hud-muted uppercase font-bold">Item Type</label>
                    <div className="flex gap-2 p-2 bg-hud-bg border border-hud-border rounded justify-around">
                      <label className="font-hud text-xs flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsConsumable}
                          onChange={(e) => {
                            setFormIsConsumable(e.target.checked)
                            if (e.target.checked) setFormSlot('')
                          }}
                          className="accent-hud-accent"
                        />
                        Consumable
                      </label>
                    </div>
                  </div>
                </div>

                {!formIsConsumable && (
                  <div className="flex flex-col gap-1">
                    <label className="font-hud text-[10px] text-hud-muted uppercase font-bold">Equipment Slot</label>
                    <select
                      value={formSlot}
                      onChange={(e) => setFormSlot(e.target.value)}
                      className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-2 outline-none focus:border-hud-accent"
                    >
                      <option value="">Consumable / Utility (No Slot)</option>
                      <option value="head">Head</option>
                      <option value="face">Face</option>
                      <option value="neck">Neck</option>
                      <option value="chest">Chest</option>
                      <option value="nipples">Nipples</option>
                      <option value="arms">Arms</option>
                      <option value="hands">Hands</option>
                      <option value="fingers">Fingers</option>
                      <option value="legs">Legs</option>
                      <option value="feet">Feet</option>
                      <option value="toes">Toes</option>
                      <option value="mainHand">Main Hand</option>
                      <option value="offHand">Off Hand</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="font-hud text-[10px] text-hud-muted uppercase font-bold">Effort Type</label>
                    <select
                      value={formEffortType}
                      onChange={(e) => setFormEffortType(e.target.value)}
                      className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-2 outline-none focus:border-hud-accent"
                    >
                      <option value="">None / Narrative</option>
                      <option value="basic">Basic (d4)</option>
                      <option value="weapon">Weapon (d6)</option>
                      <option value="magic">Magic (d10)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-hud text-[10px] text-hud-muted uppercase font-bold">Min Floor Found</label>
                    <input
                      type="number"
                      min={1}
                      max={18}
                      value={formFloorFound}
                      onChange={(e) => setFormFloorFound(parseInt(e.target.value) || 1)}
                      className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-2 outline-none focus:border-hud-accent"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-hud text-[10px] text-hud-muted uppercase font-bold">Skill Bonus / Mechanics</label>
                  <input
                    value={formSkillBonus}
                    onChange={(e) => setFormSkillBonus(e.target.value)}
                    placeholder="e.g. +2 to Melee Combat, heals 5 HP"
                    className="bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-2 outline-none focus:border-hud-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full font-hud text-xs bg-hud-accent text-hud-bg py-2.5 rounded font-extrabold uppercase hover:shadow-lg hover:brightness-110 transition-all mt-4"
              >
                {isCreating ? '✓ SAVE CUSTOM ITEM' : '✓ SAVE EDITS'}
              </button>
            </form>
          ) : selected ? (
            /* Selected Item details view */
            <div className="flex flex-col gap-5 h-full justify-between">
              <div className="flex flex-col gap-4">
                {/* Item Card header */}
                <div className="border-b border-hud-border pb-3">
                  <span
                    className="font-hud text-[8px] border px-1.5 py-0.5 font-bold uppercase rounded"
                    style={{
                      borderColor: TIER_COLOURS[selected.tier.toLowerCase()] || '#64748b',
                      color: TIER_COLOURS[selected.tier.toLowerCase()] || '#64748b',
                      backgroundColor: `${TIER_COLOURS[selected.tier.toLowerCase()]}05`,
                    }}
                  >
                    {selected.tier.toUpperCase()} ITEM
                  </span>
                  <h4 className="font-hud text-lg text-hud-text font-extrabold uppercase mt-2">
                    {selected.name}
                  </h4>
                </div>

                {/* Specs */}
                <div className="flex flex-col gap-2 font-mono text-[11px] text-hud-muted">
                  <div className="flex justify-between border-b border-hud-border/10 pb-1">
                    <span>ITEM SLOT</span>
                    <span className="text-hud-text uppercase">{selected.slot || 'Consumable'}</span>
                  </div>
                  <div className="flex justify-between border-b border-hud-border/10 pb-1">
                    <span>EFFORT TYPE</span>
                    <span className="text-hud-text uppercase">{selected.effortType || 'None'}</span>
                  </div>
                  <div className="flex justify-between border-b border-hud-border/10 pb-1">
                    <span>MIN CRAWL FLOOR</span>
                    <span className="text-hud-text">{selected.floorFound}</span>
                  </div>
                  {selected.lootBoxTier && (
                    <div className="flex justify-between border-b border-hud-border/10 pb-1">
                      <span>BOX RETRIEVAL TIER</span>
                      <span className="text-hud-accent uppercase">{selected.lootBoxTier}</span>
                    </div>
                  )}
                </div>

                {/* Flavour / Desc */}
                <div className="bg-hud-bg/50 border border-hud-border/40 p-3 rounded text-xs leading-relaxed text-hud-muted italic">
                  "{selected.description || 'No description provided by the System.'}"
                </div>

                {/* Mechanics & Bonuses */}
                {selected.skillBonus && (
                  <div className="border border-cyan-900 bg-cyan-950/10 p-3 rounded flex flex-col gap-1">
                    <span className="font-hud text-[9px] text-cyan-400 font-bold tracking-widest uppercase">
                      SYSTEM REWARD MODIFIER
                    </span>
                    <span className="font-hud text-xs text-cyan-200 leading-relaxed">
                      {selected.skillBonus}
                    </span>
                  </div>
                )}
              </div>

              {/* GM custom item controls (Edit/Delete) */}
              {selected.campaignId && (
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-hud-border">
                  <button
                    onClick={() => startEdit(selected)}
                    className="font-hud text-xs border border-hud-border text-hud-text py-2 rounded hover:border-hud-accent hover:text-hud-accent transition-colors uppercase font-bold"
                  >
                    [ EDIT ]
                  </button>
                  <button
                    onClick={() => deleteItem(selected)}
                    className="font-hud text-xs border border-red-900 text-red-500 py-2 rounded hover:bg-red-950/20 transition-colors uppercase font-bold"
                  >
                    [ ERASE ]
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-hud-muted italic border border-dashed border-hud-border/40 rounded-lg">
              <span className="text-3xl mb-2">📦</span>
              <p className="font-hud text-xs">Select any item from the catalogue to view its structural specs, or click the create button to author custom assets.</p>
              <button
                onClick={startCreate}
                className="mt-4 font-hud text-[11px] text-hud-accent border border-hud-accent/40 bg-hud-accent/5 hover:bg-hud-accent/20 transition-all rounded px-4 py-2 font-bold uppercase"
              >
                Create Custom Asset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
