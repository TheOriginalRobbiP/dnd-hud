import { useState, useEffect, useCallback } from 'react'

interface Item {
  id: string
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

export function ItemDatabasePanel() {
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('')
  const [slot, setSlot] = useState('')
  const [floor, setFloor] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Item | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (tier) params.set('tier', tier)
      if (slot) params.set('slot', slot)
      if (floor) params.set('floor', floor)
      const res = await fetch(`/api/items?${params}`)
      setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }, [search, tier, slot, floor])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

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
      <div className="mb-4">
        <h3 className="font-hud text-base text-hud-accent tracking-widest font-bold uppercase">📦 BORANT CORP CENTRAL ITEM BANK</h3>
        <p className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mt-0.5">
          Global Item Catalogue Search and Reference Module
        </p>
      </div>

      {/* Search Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-hud-panel border border-hud-border p-3 rounded-lg mb-4">
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
      </div>

      {/* Main Grid: List on Left, Detail Card on Right */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 overflow-hidden">
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
                onClick={() => setSelected(item)}
                className={`text-left border p-3.5 transition-all rounded-md ${
                  selected?.id === item.id
                    ? 'border-hud-accent bg-hud-bg/80 shadow-md'
                    : 'border-hud-border/40 hover:border-hud-accent/60 bg-hud-panel/20 hover:bg-hud-panel/40'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-hud text-sm text-hud-text font-bold uppercase tracking-wider truncate">
                    {item.name}
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
                <div className="font-hud text-xs text-hud-muted mt-1.5 leading-relaxed">
                  {item.description}
                </div>
              </button>
            ))}
        </div>

        {/* Selected Item Detail Sidebar */}
        <div className="border border-hud-border bg-hud-panel p-5 rounded-lg flex flex-col justify-between max-h-full overflow-y-auto">
          {selected ? (
            <div className="flex flex-col gap-4">
              {/* Item Card header */}
              <div className="border-b border-hud-border pb-3">
                <span
                  className="font-hud text-[8px] border px-1.5 py-0.5 font-bold uppercase rounded"
                  style={{
                    borderColor: TIER_COLOURS[selected.tier.toLowerCase()] || '#64748b',
                    color: TIER_COLOURS[selected.tier.toLowerCase()] || '#64748b',
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
                "{selected.description}"
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
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-hud-muted italic border border-dashed border-hud-border/40 rounded-lg">
              <span className="text-3xl mb-2">📦</span>
              <p className="font-hud text-xs">Select any item from the catalogue to view its structural specs and mechanical modifiers.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
