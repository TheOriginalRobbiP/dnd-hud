import type { Character } from '../../types'
import { useState } from 'react'

interface PartySidebarProps {
  characters: Character[]
  myCharId: string
  onInspect?: (charId: string) => void
}

export function PartySidebar({ characters, myCharId, onInspect }: PartySidebarProps) {
  const [open, setOpen] = useState(false)
  const others = characters.filter(c => c.id !== myCharId)
  if (others.length === 0) return null

  return (
    <div className="border border-hud-border">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-3 py-2 font-hud text-sm text-hud-muted hover:text-hud-text transition-colors"
        aria-expanded={open}>
        <span className="tracking-wider">PARTY STATUS</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-hud-border flex flex-col gap-2 p-3">
          {others.map(c => {
            const pct = c.maxHp > 0 ? Math.max(0, c.hp / c.maxHp) : 0
            const col = pct > 0.5 ? 'var(--hp-high)' : pct > 0.25 ? 'var(--hp-mid)' : 'var(--hp-low)'
            return (
              <div key={c.id}
                onClick={() => onInspect?.(c.id)}
                className={onInspect ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}>
                <div className="flex justify-between font-hud text-sm mb-1">
                  <span className={c.isAlive ? 'text-hud-text' : 'text-hp-low'}>
                    {c.isAlive ? c.crawlerName : `☠ ${c.crawlerName}`}
                    {onInspect && <span className="text-hud-muted text-xs ml-2">↗</span>}
                  </span>
                  <span className="text-hud-muted">{c.hp}/{c.maxHp}</span>
                </div>
                <div className="w-full h-1.5 bg-hud-border">
                  <div className="h-full transition-all duration-300" style={{ width: `${pct * 100}%`, backgroundColor: col }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
