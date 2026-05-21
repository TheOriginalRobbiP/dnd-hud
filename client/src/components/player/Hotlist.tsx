import { useState } from 'react'
import type { Character, WSMessage } from '../../types'

function isConsumableItem(item: any): boolean {
  if (item.isConsumable) return true
  if (item.equippedSlot) return false
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

interface HotlistProps {
  character: Character
  send: (msg: WSMessage) => void
  onCharacterUpdate: () => void
}

export function Hotlist({ character, send }: HotlistProps) {
  const [using, setUsing] = useState<string | null>(null)
  
  const carried = character.inventory.filter((i: any) => !i.isEquipped)
  const hotlisted = carried.filter((i: any) => i.isHotlisted)

  // Group identical items on the hotlist strictly by lowercase trimmed name
  const stackedHotlist: { key: string; items: any[]; primary: any }[] = []
  
  hotlisted.forEach((item: any) => {
    const key = item.name.trim().toLowerCase()
    const existing = stackedHotlist.find(s => s.key === key)
    if (existing) {
      existing.items.push(item)
    } else {
      stackedHotlist.push({
        key,
        items: [item],
        primary: item
      })
    }
  })

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
    setTimeout(() => setUsing(null), 1000)
  }

  return (
    <div className="border border-hud-border bg-hud-panel/25 p-2 rounded-lg flex flex-col gap-1.5">
      <div className="font-hud text-[10px] text-hud-muted tracking-widest flex justify-between items-center uppercase border-b border-hud-border/40 pb-1">
        <span>🎒 ACTIVE HOTLIST</span>
        <span className="text-[8px] text-hud-muted normal-case italic">max 6 slots</span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {Array.from({ length: 6 }).map((_, idx) => {
          const stack = stackedHotlist[idx]
          if (stack) {
            const item = stack.primary
            const count = stack.items.length
            const consumable = isConsumableItem(item)
            const charges = item.charges ?? null
            return (
              <div key={item.id} className="border border-hud-accent bg-hud-panel p-1.5 text-center rounded flex flex-col justify-between min-h-[62px] relative overflow-hidden transition-all duration-200">
                <div className="font-hud text-[9px] text-hud-accent font-bold truncate uppercase leading-tight pr-1.5" title={item.name}>{item.name}</div>
                
                {/* Badge for stacking */}
                {count > 1 && (
                  <div className="absolute top-0 right-0 bg-hud-accent text-hud-bg text-[7px] font-extrabold px-1 rounded-bl leading-none py-0.5">
                    {count}
                  </div>
                )}

                <div className="flex flex-col gap-0.5 mt-auto w-full">
                  {consumable ? (
                    <button
                      onClick={() => useItem(item)}
                      disabled={using === item.id}
                      className="font-hud text-[9px] text-hud-bg bg-amber-500 hover:bg-amber-400 font-extrabold px-1.5 py-1 rounded leading-none transition-colors w-full"
                    >
                      {using === item.id ? '...' : charges != null ? `USE(${charges})` : 'USE'}
                    </button>
                  ) : (
                    <div className="font-hud text-[9px] text-hud-muted italic leading-none text-center py-1 bg-hud-panel/40 border border-hud-border/30 rounded">
                      gear
                    </div>
                  )}
                </div>
              </div>
            )
          } else {
            return (
              <div key={idx} className="border border-hud-border border-dashed p-1.5 text-center rounded flex items-center justify-center min-h-[62px] bg-hud-panel/5">
                <span className="font-hud text-[9px] text-hud-muted italic leading-none">empty</span>
              </div>
            )
          }
        })}
      </div>
    </div>
  )
}