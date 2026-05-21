import { useState } from 'react'
import type { Character, LootBox as LootBoxType, WSMessage } from '../../types'
import { LootBox } from './LootBox'

const SLOTS = [
  'head','face','neck','chest','nipples','arms',
  'hands','fingers','legs','feet','toes','mainHand','offHand'
] as const

const SLOT_LABELS: Record<string, string> = {
  head:'Head', face:'Face', neck:'Neck', chest:'Chest', nipples:'Nipples',
  arms:'Arms', hands:'Hands', fingers:'Fingers', legs:'Legs',
  feet:'Feet', toes:'Toes', mainHand:'Main Hand', offHand:'Off Hand'
}

const TIER_COLOURS: Record<string, string> = {
  common:'#64748b', uncommon:'#22c55e', rare:'#60a5fa', legendary:'#a855f7'
}

// Detect consumable from item data — isConsumable flag OR known keywords in description
function isConsumableItem(item: any): boolean {
  if (item.isConsumable) return true
  if (item.equippedSlot) return false  // already equipped gear
  const desc = (item.description ?? '').toLowerCase()
  const name = (item.name ?? '').toLowerCase()
  return (
    desc.includes('heals') || desc.includes('restores') || desc.includes('use') ||
    desc.includes('drink') || desc.includes('eat') || desc.includes('apply') ||
    desc.includes('uses') || desc.includes('single use') ||
    name.includes('potion') || name.includes('grenade') || name.includes('vial') ||
    name.includes('thermos') || name.includes("werther")
  )
}

// Parse HP/MP effect from description — looks for patterns like "heals 1 HP" or "restores 2 MP"
function parseEffect(item: any): { hpEffect: number | null; mpEffect: number | null } {
  if (item.hpEffect != null || item.mpEffect != null) {
    return { hpEffect: item.hpEffect ?? null, mpEffect: item.mpEffect ?? null }
  }
  const desc = (item.description ?? '').toLowerCase()
  const hpMatch = desc.match(/(?:heals?|restores?)\s+(\d+)(?:d\d+)?\s*hp/)
  const mpMatch = desc.match(/(?:heals?|restores?)\s+(\d+)(?:d\d+)?\s*mp/)
  return {
    hpEffect: hpMatch ? parseInt(hpMatch[1]) : null,
    mpEffect: mpMatch ? parseInt(mpMatch[1]) : null,
  }
}

interface InventoryTabProps {
  character: Character
  lootQueue: LootBoxType[]
  send: (msg: WSMessage) => void
  onCharacterUpdate: () => void
  hideSections?: ('loot' | 'equipment' | 'backpack')[]
  compact?: boolean
  onLogAction?: (text: string, type: 'roll' | 'item' | 'equip' | 'status' | 'system') => void
}

export function InventoryTab({ character, lootQueue, send, onCharacterUpdate, hideSections = [], compact = false, onLogAction }: InventoryTabProps) {
  const [equipping, setEquipping] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [using, setUsing] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [rarityFilter, setRarityFilter] = useState<string | null>(null) // null = ALL
  const [showConsumables, setShowConsumables] = useState(true)
  const [showGear, setShowGear] = useState(true)

  const myBoxes = lootQueue.filter(b => b.assignedTo === character.id)
  const carried = character.inventory.filter((i: any) => !i.isEquipped)
  const equipped = character.equipment as Record<string, any>

  // Adding item to hotlist does NOT remove it from inventory (per player request)
  const backpack = carried.filter((item: any) => {
    if (!rarityFilter) return true
    return item.tier?.toLowerCase() === rarityFilter.toLowerCase()
  })

  // Group identical items in the carried inventory strictly by lowercase trimmed name for 100% robust stacking
  const stackedBackpack: { key: string; items: any[]; primary: any }[] = []
  
  backpack.forEach((item: any) => {
    const key = item.name.trim().toLowerCase()
    const existing = stackedBackpack.find(s => s.key === key)
    if (existing) {
      existing.items.push(item)
    } else {
      stackedBackpack.push({
        key,
        items: [item],
        primary: item
      })
    }
  })

  const consumables = stackedBackpack.filter(s => isConsumableItem(s.primary))
  const generalItems = stackedBackpack.filter(s => !isConsumableItem(s.primary))

  const showLoot = !hideSections.includes('loot')
  const showEquip = !hideSections.includes('equipment')
  const showBag = !hideSections.includes('backpack')

  const equipItem = async (itemId: string, slot: string) => {
    const targetItem = character.inventory.find((i: any) => i.id === itemId)
    setEquipping(itemId)
    try {
      const inv = character.inventory.map((i: any) =>
        i.id === itemId ? { ...i, isEquipped: true, equippedSlot: slot } : i
      )
      const equip = { ...equipped, [slot]: targetItem }
      await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory: inv, equipment: equip })
      })
      if (targetItem) {
        onLogAction?.(`Equipped ${targetItem.name} to ${SLOT_LABELS[slot]}`, 'equip')
      }
      onCharacterUpdate()
    } finally {
      setEquipping(null)
    }
  }

  const unequipItem = async (slot: string) => {
    const item = equipped[slot]
    if (!item) return
    setEquipping(slot)
    try {
      const inv = character.inventory.map((i: any) =>
        i.id === item.id ? { ...i, isEquipped: false, equippedSlot: null } : i
      )
      const equip = { ...equipped, [slot]: null }
      await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory: inv, equipment: equip })
      })
      onLogAction?.(`Unequipped ${item.name} from ${SLOT_LABELS[slot]}`, 'equip')
      onCharacterUpdate()
    } finally {
      setEquipping(null)
    }
  }

  const toggleHotlist = async (targetItem: any) => {
    try {
      const isCurrentlyHotlisted = !targetItem.isHotlisted
      const targetName = targetItem.name.trim().toLowerCase()

      const inv = character.inventory.map((i: any) => {
        const matches = i.name.trim().toLowerCase() === targetName;
        return matches ? { ...i, isHotlisted: isCurrentlyHotlisted } : i;
      })

      await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory: inv })
      })
      onLogAction?.(`${isCurrentlyHotlisted ? 'Pinned' : 'Unpinned'} ${targetItem.name} ${isCurrentlyHotlisted ? 'to' : 'from'} Hotlist`, 'item')
      onCharacterUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  const useItem = (item: any) => {
    setUsing(item.id)
    const { hpEffect, mpEffect } = parseEffect(item)
    send({
      type: 'use_item',
      charId: character.id,
      itemId: item.id,
      itemName: item.name,
      hpEffect: hpEffect ?? undefined,
      mpEffect: mpEffect ?? undefined,
    })
    
    // Construct descriptive healing log
    let effectLabel = ''
    if (hpEffect != null) effectLabel += ` (${hpEffect > 0 ? '+' : ''}${hpEffect} HP)`
    if (mpEffect != null) effectLabel += ` (${mpEffect > 0 ? '+' : ''}${mpEffect} MP)`
    onLogAction?.(`Used consumable: ${item.name}${effectLabel}`, 'item')

    setExpandedItem(null)
    setTimeout(() => setUsing(null), 1000)
  }

  const renderStackedItemRow = (stack: { key: string; items: any[]; primary: any }) => {
    const item = stack.primary
    const count = stack.items.length
    const consumable = isConsumableItem(item)
    const { hpEffect, mpEffect } = parseEffect(item)
    const hasAutoEffect = hpEffect != null || mpEffect != null
    const charges = item.charges ?? null
    
    // Check if this signature is hotlisted
    const isHotlisted = stack.items.some((i: any) => i.isHotlisted)

    return (
      <div key={item.id} className="border border-hud-border bg-hud-panel rounded bg-opacity-45">
        <button
          onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
          className="w-full flex justify-between items-center p-2.5 text-left gap-2 hover:bg-hud-panel/60 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-hud text-sm text-hud-text truncate font-bold">{item.name}</span>
            {count > 1 && (
              <span className="font-hud text-xs bg-hud-border/80 border border-hud-border text-hud-accent px-1.5 py-0.5 rounded-sm font-extrabold flex-shrink-0">
                ×{count}
              </span>
            )}
            {consumable && (
              <span className="font-hud text-xs border border-amber-800 text-amber-500 px-1.5 flex-shrink-0 font-bold py-0.5 rounded-sm leading-none">
                {charges != null ? `${charges}×` : 'USE'}
              </span>
            )}
            {isHotlisted && (
              <span className="font-hud text-[9px] border border-hud-accent/40 text-hud-accent px-1 flex-shrink-0 font-bold bg-hud-accent/5 rounded-sm flex items-center gap-0.5 uppercase">
                <span>⭐</span>
                <span>PINNED</span>
              </span>
            )}
          </div>
          <span className="font-hud text-xs px-1 border flex-shrink-0 rounded-sm"
            style={{ borderColor: TIER_COLOURS[item.tier], color: TIER_COLOURS[item.tier] }}>
            {item.tier?.toUpperCase()}
          </span>
        </button>

        {expandedItem === item.id && (
          <div className="border-t border-hud-border p-3 flex flex-col gap-3 bg-hud-bg/30">
            {item.description && (
              <p className="font-hud text-xs text-hud-muted italic leading-relaxed">{item.description}</p>
            )}

            {/* Pin / Unpin to Hotlist Button */}
            <div className="flex justify-start border-t border-hud-border/40 pt-2.5">
              <button
                onClick={() => toggleHotlist(item)}
                className="font-hud text-[10px] border border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent px-2.5 py-1 rounded transition-colors flex items-center gap-1 bg-hud-panel"
              >
                <span>{isHotlisted ? '⭐' : '☆'}</span>
                <span>{isHotlisted ? 'REMOVE FROM HOTLIST' : 'PIN TO HOTLIST'}</span>
              </button>
            </div>

            {consumable ? (
              // CONSUMABLE — show USE button + effect preview
              <div className="flex flex-col gap-2 border-t border-hud-border/40 pt-2.5">
                {hasAutoEffect && (
                  <div className="font-hud text-[10px] text-hud-muted">
                    Effect: {hpEffect != null ? `${hpEffect > 0 ? '+' : ''}${hpEffect} HP` : ''}
                    {mpEffect != null ? `  ${mpEffect > 0 ? '+' : ''}${mpEffect} MP` : ''}
                    <span className="text-green-600 ml-1">(applied automatically)</span>
                  </div>
                )}
                {!hasAutoEffect && (
                  <div className="font-hud text-[10px] text-amber-600">
                    Effect logged — GM will apply.
                  </div>
                )}
                <button
                  onClick={() => useItem(item)}
                  disabled={using === item.id}
                  className="border border-amber-700 text-amber-400 font-hud text-xs py-2 hover:bg-amber-950 transition-colors disabled:opacity-40 tracking-wider font-bold bg-hud-panel rounded">
                  {using === item.id ? 'USING...' : charges != null ? `USE (${charges} left)` : 'USE CONSUMABLE'}
                </button>
              </div>
            ) : (
              // EQUIPPABLE — show slot picker
              <div className="border-t border-hud-border/40 pt-2.5">
                <div className="font-hud text-[10px] text-hud-muted tracking-wider mb-2 uppercase">EQUIP TO SLOT</div>
                <div className="flex flex-wrap gap-1">
                  {SLOTS.filter(s => !equipped[s]).map(s => (
                    <button key={s} onClick={() => equipItem(item.id, s)}
                      disabled={equipping === item.id}
                      className="font-hud text-[10px] border border-hud-border text-hud-muted px-2 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors disabled:opacity-40 bg-hud-panel rounded bg-hud-panel">
                      {SLOT_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${compact ? 'gap-3 p-0' : 'gap-6 p-4'}`}>

      {/* Loot boxes */}
      {showLoot && (
        <div>
          <div className={`font-hud text-hud-muted tracking-widest border-b border-hud-border pb-1 mb-3 uppercase ${compact ? 'text-xs' : 'text-sm'}`}>LOOT BOXES</div>
          {myBoxes.length === 0
            ? <p className="font-hud text-xs text-hud-muted italic">No pending loot boxes. Keep earning, Crawler.</p>
            : <div className="flex flex-col gap-2">
                {myBoxes.map(b => <LootBox key={b.id} lootBox={b} charId={character.id} send={send} />)}
              </div>
          }
        </div>
      )}

      {/* Equipment slots */}
      {showEquip && (
        <div>
          <div className={`font-hud text-hud-muted tracking-widest border-b border-hud-border pb-1 mb-3 uppercase ${compact ? 'text-xs' : 'text-sm'}`}>EQUIPMENT</div>
          <div className="grid grid-cols-3 gap-2">
            {SLOTS.map(slot => {
              const item = equipped[slot]
              const isSelected = selectedSlot === slot
              const borderStyle = isSelected 
                ? 'border-hud-accent ring-1 ring-hud-accent bg-hud-accent/5' 
                : item 
                ? 'border-hud-accent/60 hover:border-hud-accent cursor-pointer' 
                : 'border-hud-border'

              return (
                <div 
                  key={slot} 
                  onClick={() => item && setSelectedSlot(isSelected ? null : slot)}
                  className={`border bg-hud-panel transition-all duration-150 rounded ${
                    compact ? 'p-1.5' : 'p-3'
                  } ${borderStyle}`}
                >
                  <div className={`font-hud text-hud-muted tracking-wider uppercase leading-none ${
                    compact ? 'text-[8px]' : 'text-[10px]'
                  }`}>{SLOT_LABELS[slot]}</div>
                  {item ? (
                    <div className={`font-hud text-hud-accent mt-1 truncate font-bold ${
                      compact ? 'text-xs leading-tight' : 'text-sm'
                    }`}>{item.name}</div>
                  ) : (
                    <div className={`font-hud text-hud-muted mt-1 italic leading-tight ${
                      compact ? 'text-[10px]' : 'text-xs'
                    }`}>empty</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Equipment Details Panel */}
      {showEquip && selectedSlot && equipped[selectedSlot] && (
        <div className="border border-hud-accent bg-hud-panel/40 p-4 rounded-lg flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <button 
              onClick={() => setSelectedSlot(null)}
              className="text-hud-muted hover:text-red-500 font-hud text-[10px] px-1.5 py-0.5 border border-hud-border/40 hover:border-red-900 rounded"
            >
              ✕ CLOSE
            </button>
          </div>
          {(() => {
            const item = equipped[selectedSlot]
            return (
              <>
                <div className="flex justify-between items-start pr-12">
                  <div>
                    <div className="font-hud text-[10px] text-hud-muted tracking-widest uppercase mb-1">
                      {SLOT_LABELS[selectedSlot]} SLOT
                    </div>
                    <h3 className="font-hud text-base text-hud-text font-bold leading-none">{item.name}</h3>
                  </div>
                  <span className="font-hud text-[10px] px-2 py-0.5 border rounded flex-shrink-0"
                    style={{ borderColor: TIER_COLOURS[item.tier], color: TIER_COLOURS[item.tier] }}>
                    {item.tier?.toUpperCase()}
                  </span>
                </div>
                {item.description && (
                  <p className="font-hud text-xs text-hud-muted italic leading-relaxed border-t border-hud-border/40 pt-2 mt-1">
                    {item.description}
                  </p>
                )}
                <div className="flex gap-3 justify-end mt-2 border-t border-hud-border/40 pt-3">
                  <button
                    onClick={() => {
                      unequipItem(selectedSlot)
                      setSelectedSlot(null)
                    }}
                    disabled={equipping === selectedSlot}
                    className="font-hud text-[10px] text-red-400 border border-red-900/60 bg-red-950/10 px-3 py-1.5 hover:bg-red-950/30 hover:border-red-600 transition-colors rounded disabled:opacity-40"
                  >
                    {equipping === selectedSlot ? 'UNEQUIPPING...' : 'UNEQUIP ITEM'}
                  </button>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Carried items (INVENTORY) */}
      {showBag && (
        <div className="flex flex-col gap-3">
          <div className="font-hud text-sm text-hud-muted tracking-widest border-b border-hud-border pb-1 mb-1 uppercase">
            🎒 INVENTORY ({carried.length} ITEMS)
          </div>
          
          <div className="flex flex-col gap-4">
            
            {/* Rarity Filter Bar */}
            <div className="flex flex-wrap gap-1.5 mb-1 border-b border-hud-border/20 pb-2">
              <span className="font-hud text-[10px] text-hud-muted self-center uppercase mr-1 tracking-wider">Filter:</span>
              {[
                { id: null, label: 'ALL', color: 'border-hud-border/40 text-hud-muted hover:border-hud-accent' },
                { id: 'common', label: 'COMMON', color: 'border-slate-500/40 text-slate-400 hover:border-slate-400' },
                { id: 'uncommon', label: 'UNCOMMON', color: 'border-green-800/40 text-green-400 hover:border-green-500' },
                { id: 'rare', label: 'RARE', color: 'border-blue-900/40 text-blue-400 hover:border-blue-400' },
                { id: 'legendary', label: 'LEGENDARY', color: 'border-purple-900/40 text-purple-400 hover:border-purple-400' },
              ].map(f => {
                const isActive = rarityFilter === f.id
                return (
                  <button
                    key={f.label}
                    onClick={() => setRarityFilter(f.id)}
                    className={`font-hud text-[9px] border px-2 py-0.5 transition-all rounded-sm tracking-wider ${
                      isActive 
                        ? 'bg-hud-accent/15 border-hud-accent text-hud-accent font-extrabold ring-1 ring-hud-accent/30' 
                        : f.color + ' bg-hud-panel/40'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* Consumables Accordion */}
            <div>
              <button
                onClick={() => setShowConsumables(!showConsumables)}
                className="w-full font-hud text-[10px] text-hud-accent/80 tracking-wider uppercase mb-2 flex justify-between items-center border-b border-hud-border/10 pb-1.5 font-bold hover:text-hud-text transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>🧪</span>
                  <span>CONSUMABLES ({consumables.reduce((acc, s) => acc + s.items.length, 0)})</span>
                </div>
                <span className="text-hud-muted text-[9px]">{showConsumables ? '▲' : '▼'}</span>
              </button>
              {showConsumables && (
                <div>
                  {consumables.length === 0 ? (
                    <p className="font-hud text-xs text-hud-muted italic p-2 border border-hud-border/10 rounded bg-hud-panel/10">No consumables found.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {consumables.map(stack => renderStackedItemRow(stack))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* General Items & Gear Accordion */}
            <div>
              <button
                onClick={() => setShowGear(!showGear)}
                className="w-full font-hud text-[10px] text-hud-accent/80 tracking-wider uppercase mb-2 flex justify-between items-center border-b border-hud-border/10 pb-1.5 font-bold hover:text-hud-text transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>⚔️</span>
                  <span>ITEMS & GEAR ({generalItems.reduce((acc, s) => acc + s.items.length, 0)})</span>
                </div>
                <span className="text-hud-muted text-[9px]">{showGear ? '▲' : '▼'}</span>
              </button>
              {showGear && (
                <div>
                  {generalItems.length === 0 ? (
                    <p className="font-hud text-xs text-hud-muted italic p-2 border border-hud-border/10 rounded bg-hud-panel/10">No items or gear found.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {generalItems.map(stack => renderStackedItemRow(stack))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}