import { useState, useEffect, useCallback } from 'react'
import type { WSMessage } from '../../types'
import { tierColour, TIER_LABELS } from '../../utils/colours'

const TIERS = ['bronze','silver','gold','platinum','legendary','celestial'] as const
type LootBoxTier = typeof TIERS[number]

interface DBItem {
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

function pickRandom<T>(arr: T[]): T | null {
  if (!arr.length) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

interface LootAssignModalProps {
  characterId: string
  characterName: string
  onClose: () => void
  send: (msg: WSMessage) => void
}

export function LootAssignModal({ characterId, characterName, onClose, send }: LootAssignModalProps) {
  const [tier, setTier] = useState<LootBoxTier>('bronze')
  const [mode, setMode] = useState<'pick' | 'random' | 'custom'>('random')
  const [search, setSearch] = useState('')
  const [dbItems, setDbItems] = useState<DBItem[]>([])
  const [selectedItem, setSelectedItem] = useState<DBItem | null>(null)
  const [customName, setCustomName] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      const res = await fetch(`/api/items?${params}`)
      const data = await res.json()
      // Filter to items appropriate for this loot box tier
      // Strict tier filter: only show items that drop from this exact box tier
      setDbItems(data.filter((i: DBItem) => {
        if (!i.lootBoxTier) return false // items with no loot box tier are GM-only
        return i.lootBoxTier === tier
      }))
    } finally {
      setLoading(false)
    }
  }, [search, tier])

  useEffect(() => { fetchItems() }, [fetchItems])

  const assign = () => {
    let name: string
    let desc: string
    let itemTier: string = 'common'
    let itemSlot: string | null = null

    if (mode === 'random') {
      const picked = pickRandom(dbItems)
      if (!picked) return
      name = picked.name
      desc = picked.description
      itemTier = picked.tier
      itemSlot = picked.slot
    } else if (mode === 'pick') {
      if (!selectedItem) return
      name = selectedItem.name
      desc = selectedItem.description ?? ''
      itemTier = selectedItem.tier
      itemSlot = selectedItem.slot
    } else {
      name = customName.trim()
      desc = customDesc.trim()
      if (!name) return
    }

    send({
      type: 'loot_assign',
      lootBox: {
        id: crypto.randomUUID(),
        tier,
        contents: [{
          id: crypto.randomUUID(),
          name,
          description: desc,
          tier: (itemTier as any) ?? 'common',
          isEquipped: false,
          equippedSlot: itemSlot as any ?? null,
          fromLootBox: true,
          lootBoxTier: tier,
        }],
        state: 'pending',
        assignedTo: characterId,
        assignedAt: Date.now(),
      }
    })
    onClose()
  }

  const TIER_COLOURS_MAP: Record<string, string> = {
    common: '#64748b', uncommon: '#22c55e', rare: '#60a5fa', legendary: '#a855f7'
  }

  return (
    <div className="fixed inset-0 bg-hud-bg/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-hud-panel border border-hud-border w-full max-w-lg p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="font-hud text-hud-accent tracking-widest text-sm">ASSIGNING LOOT — {characterName.toUpperCase()}</div>
          <button onClick={onClose} aria-label="Close" className="font-hud text-hud-muted hover:text-hp-low px-2">✕</button>
        </div>

        {/* Tier selector */}
        <div>
          <div className="font-hud text-xs text-hud-muted mb-2 tracking-wider">SELECT TIER</div>
          <div className="flex gap-2 flex-wrap">
            {TIERS.map(t => (
              <button key={t} onClick={() => { setTier(t); setSelectedItem(null) }}
                className="px-3 py-2 font-hud text-sm border transition-colors tracking-wider"
                style={{ borderColor: tier === t ? tierColour(t) : undefined, color: tier === t ? tierColour(t) : undefined }}>
                {TIER_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button onClick={() => setMode('random')}
            className={`flex-1 font-hud text-sm py-2 border transition-colors ${mode === 'random' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted'}`}>
            🎲 RANDOM
          </button>
          <button onClick={() => setMode('pick')}
            className={`flex-1 font-hud text-sm py-2 border transition-colors ${mode === 'pick' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted'}`}>
            BROWSE
          </button>
          <button onClick={() => { setMode('custom'); setSelectedItem(null) }}
            className={`flex-1 font-hud text-sm py-2 border transition-colors ${mode === 'custom' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted'}`}>
            CUSTOM
          </button>
        </div>

        {mode === 'random' && (
          <div className="border border-hud-border p-4 flex flex-col gap-3 items-center text-center">
            <div className="font-hud text-xs text-hud-muted tracking-wider">
              ROLL FROM {tier.toUpperCase()} TABLE — {dbItems.length} ITEMS
            </div>
            {loading
              ? <div className="font-hud text-sm text-hud-muted animate-pulse">Loading table...</div>
              : dbItems.length === 0
                ? <div className="font-hud text-sm text-hud-muted italic">No items in this tier yet.</div>
                : <div className="font-hud text-xs text-hud-muted">
                    Press ASSIGN BOX to roll a random item from the {tier} table. Item revealed only when the box is opened.
                  </div>
            }
          </div>
        )}

        {mode === 'pick' && <>
          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />

          {/* Item list */}
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {loading && <div className="font-hud text-sm text-hud-muted animate-pulse p-2">Searching...</div>}
            {!loading && dbItems.length === 0 && (
              <div className="font-hud text-sm text-hud-muted italic p-2">No items found. Try a different search.</div>
            )}
            {!loading && dbItems.map(item => (
              <button key={item.id} onClick={() => setSelectedItem(item)}
                className={`text-left border p-3 transition-colors ${selectedItem?.id === item.id ? 'border-hud-accent bg-hud-bg' : 'border-hud-border hover:border-hud-accent'}`}>
                <div className="flex justify-between items-start gap-2">
                  <span className="font-hud text-sm text-hud-text">{item.name}</span>
                  <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                    <span className="font-hud text-xs px-1 border" style={{ borderColor: TIER_COLOURS_MAP[item.tier], color: TIER_COLOURS_MAP[item.tier] }}>
                      {item.tier.toUpperCase()}
                    </span>
                    {item.isConsumable && <span className="font-hud text-xs text-hud-cyan border border-hud-cyan px-1">USE</span>}
                    {item.slot && !item.isConsumable && <span className="font-hud text-xs text-hud-muted border border-hud-border px-1">{item.slot}</span>}
                  </div>
                </div>
                <div className="font-hud text-xs text-hud-muted mt-1 italic">{item.description}</div>
                {item.skillBonus && (
                  <div className="font-hud text-xs text-hud-cyan mt-1">{item.skillBonus}</div>
                )}
              </button>
            ))}
          </div>
        </>}

        {mode === 'custom' && <>
          <div>
            <div className="font-hud text-xs text-hud-muted mb-1 tracking-wider">ITEM NAME</div>
            <input value={customName} onChange={e => setCustomName(e.target.value)}
              placeholder="e.g. Rusty Sword of Mild Disappointment"
              className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
          </div>
          <div>
            <div className="font-hud text-xs text-hud-muted mb-1 tracking-wider">DESCRIPTION</div>
            <textarea value={customDesc} onChange={e => setCustomDesc(e.target.value)}
              rows={3} placeholder="The System describes this item as..."
              className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none resize-none" />
          </div>
        </>}

        {/* Selected item preview */}
        {mode === 'pick' && selectedItem && (
          <div className="border p-3" style={{ borderColor: tierColour(tier) }}>
            <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">SELECTED</div>
            <div className="font-hud text-sm text-hud-text">{selectedItem.name}</div>
            {selectedItem.skillBonus && <div className="font-hud text-xs text-hud-cyan mt-1">{selectedItem.skillBonus}</div>}
          </div>
        )}

        {/* Assign button */}
        <div className="flex gap-2">
          <button onClick={assign}
            disabled={
              mode === 'random' ? dbItems.length === 0 :
              mode === 'pick' ? !selectedItem :
              !customName.trim()
            }
            className="flex-1 border border-hud-accent text-hud-accent font-hud text-sm py-3 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-wider disabled:opacity-40">
            {mode === 'random' ? '🎲 ROLL & ASSIGN' : 'ASSIGN BOX'}
          </button>
          <button onClick={onClose} aria-label="Cancel"
            className="border border-hud-border text-hud-muted font-hud text-sm px-4 hover:border-hp-low hover:text-hp-low transition-colors">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}
