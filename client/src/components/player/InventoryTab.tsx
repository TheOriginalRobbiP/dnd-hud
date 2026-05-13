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
}

export function InventoryTab({ character, lootQueue, send, onCharacterUpdate }: InventoryTabProps) {
  const [equipping, setEquipping] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [using, setUsing] = useState<string | null>(null)

  const myBoxes = lootQueue.filter(b => b.assignedTo === character.id)
  const carried = character.inventory.filter((i: any) => !i.isEquipped)
  const equipped = character.equipment as Record<string, any>

  const equipItem = async (itemId: string, slot: string) => {
    setEquipping(itemId)
    try {
      const inv = character.inventory.map((i: any) =>
        i.id === itemId ? { ...i, isEquipped: true, equippedSlot: slot } : i
      )
      const equip = { ...equipped, [slot]: character.inventory.find((i: any) => i.id === itemId) }
      await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory: inv, equipment: equip })
      })
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
      onCharacterUpdate()
    } finally {
      setEquipping(null)
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
    setExpandedItem(null)
    setTimeout(() => setUsing(null), 1000)
  }

  return (
    <div className="p-4 flex flex-col gap-6">

      {/* Loot boxes */}
      <div>
        <div className="font-hud text-sm text-hud-muted tracking-widest border-b border-hud-border pb-1 mb-3">LOOT BOXES</div>
        {myBoxes.length === 0
          ? <p className="font-hud text-sm text-hud-muted italic">No pending loot boxes. Keep earning, Crawler.</p>
          : <div className="flex flex-col gap-2">
              {myBoxes.map(b => <LootBox key={b.id} lootBox={b} charId={character.id} send={send} />)}
            </div>
        }
      </div>

      {/* Equipment slots */}
      <div>
        <div className="font-hud text-sm text-hud-muted tracking-widest border-b border-hud-border pb-1 mb-3">EQUIPMENT</div>
        <div className="grid grid-cols-3 gap-2">
          {SLOTS.map(slot => {
            const item = equipped[slot]
            return (
              <div key={slot} className={`border p-3 bg-hud-panel ${item ? 'border-hud-accent' : 'border-hud-border'}`}>
                <div className="font-hud text-xs text-hud-muted tracking-wider uppercase">{SLOT_LABELS[slot]}</div>
                {item ? (
                  <div>
                    <div className="font-hud text-sm text-hud-accent mt-1 truncate">{item.name}</div>
                    <button
                      onClick={() => unequipItem(slot)}
                      disabled={equipping === slot}
                      className="font-hud text-xs text-hud-muted hover:text-hp-low transition-colors mt-1 disabled:opacity-40">
                      {equipping === slot ? 'removing...' : 'unequip'}
                    </button>
                  </div>
                ) : (
                  <div className="font-hud text-sm text-hud-muted mt-1 italic">empty</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Carried items */}
      <div>
        <div className="font-hud text-sm text-hud-muted tracking-widest border-b border-hud-border pb-1 mb-3">CARRIED ITEMS</div>
        {carried.length === 0
          ? <p className="font-hud text-sm text-hud-muted italic">Inventory empty. The System judges you.</p>
          : <div className="flex flex-col gap-2">
              {carried.map((item: any) => {
                const consumable = isConsumableItem(item)
                const { hpEffect, mpEffect } = parseEffect(item)
                const hasAutoEffect = hpEffect != null || mpEffect != null
                const charges = item.charges ?? null

                return (
                  <div key={item.id} className="border border-hud-border bg-hud-panel">
                    <button
                      onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                      className="w-full flex justify-between items-center p-3 text-left gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-hud text-sm text-hud-text truncate">{item.name}</span>
                        {consumable && (
                          <span className="font-hud text-xs border border-amber-800 text-amber-500 px-1 flex-shrink-0">
                            {charges != null ? `${charges}×` : 'USE'}
                          </span>
                        )}
                      </div>
                      <span className="font-hud text-xs px-1 border flex-shrink-0"
                        style={{ borderColor: TIER_COLOURS[item.tier], color: TIER_COLOURS[item.tier] }}>
                        {item.tier?.toUpperCase()}
                      </span>
                    </button>

                    {expandedItem === item.id && (
                      <div className="border-t border-hud-border p-3 flex flex-col gap-3">
                        {item.description && (
                          <p className="font-hud text-sm text-hud-muted italic leading-relaxed">{item.description}</p>
                        )}

                        {consumable ? (
                          // CONSUMABLE — show USE button + effect preview
                          <div className="flex flex-col gap-2">
                            {hasAutoEffect && (
                              <div className="font-hud text-xs text-hud-muted">
                                Effect: {hpEffect != null ? `${hpEffect > 0 ? '+' : ''}${hpEffect} HP` : ''}
                                {mpEffect != null ? `  ${mpEffect > 0 ? '+' : ''}${mpEffect} MP` : ''}
                                {hasAutoEffect && <span className="text-green-600 ml-1">(applied automatically)</span>}
                              </div>
                            )}
                            {!hasAutoEffect && (
                              <div className="font-hud text-xs text-amber-600">
                                Effect logged — GM will apply.
                              </div>
                            )}
                            <button
                              onClick={() => useItem(item)}
                              disabled={using === item.id}
                              className="border border-amber-700 text-amber-400 font-hud text-sm py-2 hover:bg-amber-950 transition-colors disabled:opacity-40 tracking-wider">
                              {using === item.id ? 'USING...' : charges != null ? `USE (${charges} left)` : 'USE'}
                            </button>
                          </div>
                        ) : (
                          // EQUIPPABLE — show slot picker
                          <div>
                            <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">EQUIP TO SLOT</div>
                            <div className="flex flex-wrap gap-1">
                              {SLOTS.filter(s => !equipped[s]).map(s => (
                                <button key={s} onClick={() => equipItem(item.id, s)}
                                  disabled={equipping === item.id}
                                  className="font-hud text-xs border border-hud-border text-hud-muted px-2 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors disabled:opacity-40">
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
              })}
            </div>
        }
      </div>
    </div>
  )
}
