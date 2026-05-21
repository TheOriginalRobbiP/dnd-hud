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

export function Hotlist({ character, send, onCharacterUpdate }: HotlistProps) {
  const [using, setUsing] = useState<string | null>(null)
  
  const carried = character.inventory.filter((i: any) => !i.isEquipped)
  const hotlisted = carried.filter((i: any) => i.isHotlisted)

  const toggleHotlist = async (itemId: string) => {
    try {
      const inv = character.inventory.map((i: any) =>
        i.id === itemId ? { ...i, isHotlisted: !i.isHotlisted } : i
      )
      await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory: inv })
      })
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
    setTimeout(() => setUsing(null), 1000)
  }

  return (
    <div className="border border-hud-border bg-hud-panel/25 p-2 rounded-lg flex flex-col gap-1.5">
      <div className="font-hud text-[10px] text-hud-muted tracking-widest flex justify-between items-center uppercase border-b border-hud-border/40 pb-1">
        <span>🎒 ACTIVE HOTLIST</span>
        <span className="text-[8px] text-hud-muted normal-case italic">max 8 items</span>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 8 }).map((_, idx) => {
          const item = hotlisted[idx]
          if (item) {
            const consumable = isConsumableItem(item)
            const charges = item.charges ?? null
            return (
              <div key={item.id} className="border border-hud-accent bg-hud-panel p-1 text-center rounded flex flex-col justify-between min-h-[56px] relative overflow-hidden transition-all duration-200">
                <div className="font-hud text-[8px] text-hud-accent font-bold truncate uppercase leading-tight" title={item.name}>{item.name}</div>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {consumable ? (
                    <button
                      onClick={() => useItem(item)}
                      disabled={using === item.id}
                      className="font-hud text-[8px] text-hud-bg bg-amber-500 hover:bg-amber-400 font-extrabold px-1 py-0.5 rounded leading-none transition-colors"
                    >
                      {using === item.id ? '...' : charges != null ? `U(${charges})` : 'USE'}
                    </button>
                  ) : (
                    <div className="font-hud text-[7px] text-hud-muted italic leading-none">gear</div>
                  )}
                  <button
                    onClick={() => toggleHotlist(item.id)}
                    className="font-hud text-[7px] text-hud-muted hover:text-red-500 transition-colors leading-none mt-0.5"
                  >
                    UNPIN
                  </button>
                </div>
              </div>
            )
          } else {
            return (
              <div key={idx} className="border border-hud-border border-dashed p-1 text-center rounded flex items-center justify-center min-h-[56px] bg-hud-panel/5">
                <span className="font-hud text-[8px] text-hud-muted italic leading-none">empty</span>
              </div>
            )
          }
        })}
      </div>
    </div>
  )
}