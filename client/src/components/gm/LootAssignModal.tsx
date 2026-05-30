import { useState, useEffect, useCallback } from 'react'
import type { WSMessage, LootBoxType } from '../../types'
import { tierColour, TIER_LABELS } from '../../utils/colours'

const TIERS = ['bronze','silver','gold','platinum','legendary','celestial'] as const
type LootBoxTier = typeof TIERS[number]

const BOX_TYPES = [
  { id: 'adventurer', label: '📦 Adventurer Box', description: 'Standard low-level gear' },
  { id: 'assassin', label: '🗡️ Assassin Box', description: 'Stealth and poison tools' },
  { id: 'lucky_bitch', label: '🎀 Lucky Bitch Box', description: 'For little bitch gameplay' },
  { id: 'asshole', label: '💩 Asshole Box', description: 'Prizes for terrible decisions' },
  { id: 'goblin', label: '💣 Goblin Box', description: 'Explosives and tools' },
  { id: 'looter', label: '💎 Looter Box', description: 'For materialistic kleptos' },
  { id: 'lucky_bastard', label: '🎲 Lucky Bastard Box', description: 'Scratch-offs & chips' },
  { id: 'mechanic', label: '⚙️ Mechanic Box', description: 'Crafting parts & tools' },
  { id: 'pet', label: '🍖 Pet Box', description: 'Companion food & scrolls' },
  { id: 'quest', label: '🛡️ Quest Box', description: 'Quest reward drops' },
  { id: 'savage', label: '🩸 Savage Box', description: 'Crawler-slaying PVP tools' },
  { id: 'survivor', label: '🩹 Survivor Box', description: 'Last-second escape supplies' }
] as const

const TYPE_TAGS_MAP: Record<LootBoxType, string[]> = {
  adventurer: ['armor', 'basic', 'utility', 'gear', 'biscuit', 'survival', 'junk'],
  assassin: ['dagger', 'poison', 'stealth', 'speed', 'blade'],
  lucky_bitch: ['luck', 'scroll', 'gamble', 'healing', 'revive'],
  asshole: ['curse', 'junk', 'unreliable', 'hazard'],
  goblin: ['explosive', 'fire', 'demolition', 'tools', 'dynamite', 'bomb'],
  looter: ['bag', 'scroll', 'chest', 'jewelry', 'loot'],
  lucky_bastard: ['chips', 'ticket', 'token', 'luck'],
  mechanic: ['crafting', 'tool', 'engine', 'vehicle', 'parts'],
  pet: ['biscuit', 'summon', 'pet', 'feed', 'critter'],
  quest: ['quest-reward', 'relic', 'key'],
  savage: ['blade', 'net', 'trap', 'blood', 'pvp'],
  survivor: ['heal', 'shield', 'barrier', 'medic', 'potion']
}

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
  const [boxType, setBoxType] = useState<LootBoxType>('adventurer')
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
      
      // Strict tier filter: only show items that drop from this exact box tier
      const tierItems = data.filter((i: DBItem) => {
        if (!i.lootBoxTier) return false // items with no loot box tier are GM-only
        return i.lootBoxTier === tier
      })

      // Specialty-tag filter: prioritizes items matching the specialty tags if there are any!
      const tagsToMatch = TYPE_TAGS_MAP[boxType] || []
      const matchedBySpecialty = tierItems.filter((i: DBItem) => {
        const itemTags = i.tags ? i.tags.toLowerCase() : ''
        const itemName = i.name ? i.name.toLowerCase() : ''
        const itemDesc = i.description ? i.description.toLowerCase() : ''
        return tagsToMatch.some(tag => itemTags.includes(tag) || itemName.includes(tag) || itemDesc.includes(tag))
      })

      if (matchedBySpecialty.length > 0) {
        setDbItems(matchedBySpecialty)
      } else {
        setDbItems(tierItems)
      }
    } finally {
      setLoading(false)
    }
  }, [search, tier, boxType])

  useEffect(() => { fetchItems() }, [fetchItems])

  const assign = () => {
    const contents: any[] = []

    if (mode === 'random') {
      const picked = pickRandom(dbItems)
      if (!picked) return
      contents.push({
        id: crypto.randomUUID(),
        name: picked.name,
        description: picked.description,
        tier: (picked.tier as any) ?? 'common',
        isEquipped: false,
        equippedSlot: picked.slot as any ?? null,
        fromLootBox: true,
        lootBoxTier: tier,
        boxType,
      })

      // Multi-item bundle for Adventurer Boxes at Bronze tier
      if (boxType === 'adventurer' && tier === 'bronze') {
        // Find pool of small survival items from dbItems (or general items)
        const survivalPool = dbItems.filter(i => 
          (i.tags && (
            i.tags.toLowerCase().includes('survival') || 
            i.tags.toLowerCase().includes('utility') || 
            i.tags.toLowerCase().includes('junk')
          )) ||
          i.name.toLowerCase().includes('rope') || 
          i.name.toLowerCase().includes('torch') || 
          i.name.toLowerCase().includes('chalk') || 
          i.name.toLowerCase().includes('ration')
        )
        
        if (survivalPool.length > 0) {
          // Add 1 to 2 random survival items!
          const numAdditional = Math.floor(Math.random() * 2) + 1 // 1 or 2 items
          for (let k = 0; k < numAdditional; k++) {
            const addPicked = pickRandom(survivalPool)
            if (addPicked && !contents.some(item => item.name === addPicked.name)) { // avoid duplicate names in same box
              contents.push({
                id: crypto.randomUUID(),
                name: addPicked.name,
                description: addPicked.description,
                tier: (addPicked.tier as any) ?? 'common',
                isEquipped: false,
                equippedSlot: addPicked.slot as any ?? null,
                fromLootBox: true,
                lootBoxTier: tier,
                boxType,
              })
            }
          }
        }
      }
    } else if (mode === 'pick') {
      if (!selectedItem) return
      contents.push({
        id: crypto.randomUUID(),
        name: selectedItem.name,
        description: selectedItem.description ?? '',
        tier: selectedItem.tier ?? 'common',
        isEquipped: false,
        equippedSlot: selectedItem.slot as any ?? null,
        fromLootBox: true,
        lootBoxTier: tier,
        boxType,
      })
    } else {
      const name = customName.trim()
      const desc = customDesc.trim()
      if (!name) return
      contents.push({
        id: crypto.randomUUID(),
        name,
        description: desc,
        tier: 'common',
        isEquipped: false,
        equippedSlot: null,
        fromLootBox: true,
        lootBoxTier: tier,
        boxType,
      })
    }

    send({
      type: 'loot_assign',
      lootBox: {
        id: crypto.randomUUID(),
        tier,
        boxType,
        contents,
        state: 'pending',
        assignedTo: characterId,
        assignedAt: Date.now(),
      } as any
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

        {/* Specialty Box Type Selector */}
        <div>
          <div className="font-hud text-xs text-hud-muted mb-2 tracking-wider">SELECT SPECIALTY BOX TYPE</div>
          <select
            value={boxType}
            onChange={(e) => { setBoxType(e.target.value as LootBoxType); setSelectedItem(null) }}
            className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2.5 focus:border-hud-accent outline-none uppercase"
          >
            {BOX_TYPES.map(bt => (
              <option key={bt.id} value={bt.id} className="bg-hud-bg text-hud-text">
                {bt.label.toUpperCase()} — {bt.description.toUpperCase()}
              </option>
            ))}
          </select>
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
