import { useState } from 'react'
import type { AppState } from '../../types'

interface SessionLogProps {
  state: AppState
}

export function SessionLog({ state }: SessionLogProps) {
  const [open, setOpen] = useState(false)

  const exportLog = () => {
    const lines = [
      `THE HUD — SESSION LOG`,
      `Generated: ${new Date().toLocaleString()}`,
      `Floor: ${state.floor.floorNumber} — ${state.floor.neighbourhoodName}`,
      `Room: ${state.floor.roomNumber}`,
      ``,
      `═══ CRAWLERS ═══`,
      ...state.characters.map(c => [
        `${c.crawlerName} (${c.playerName})`,
        `  HP: ${c.hp}/${c.maxHp} | MP: ${c.mp}/${c.maxMp}`,
        `  Viewers: ${c.viewerCount.toLocaleString()}`,
        `  Status: ${c.isAlive ? 'Alive' : 'DECEASED'}`,
        c.statusEffects.length > 0 ? `  Effects: ${(c.statusEffects as any[]).map((e: any) => e.name).join(', ')}` : '',
        c.achievements.length > 0 ? `  Achievements: ${(c.achievements as any[]).map((a: any) => a.name).join(', ')}` : '',
        `  Inventory: ${c.inventory.length} items`,
      ].filter(Boolean).join('\n')),
      ``,
      `═══ EVENT LOG ═══`,
      ...state.gmLog,
    ]

    const content = lines.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hud-session-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="font-hud text-xs border border-hud-border text-hud-muted px-3 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider">
      SESSION LOG
    </button>
  )

  return (
    <div className="fixed inset-0 bg-hud-bg/90 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
      <div className="bg-hud-panel border border-hud-border w-full max-w-lg p-5 flex flex-col gap-4 max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <div className="font-hud text-hud-accent tracking-widest text-sm">SESSION LOG</div>
          <button onClick={() => setOpen(false)} aria-label="Close" className="font-hud text-hud-muted hover:text-hp-low px-2">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">RECENT EVENTS</div>
          {state.gmLog.length === 0
            ? <p className="font-hud text-sm text-hud-muted italic">No events logged yet. Something has gone very wrong or nothing has happened.</p>
            : state.gmLog.map((entry, i) => (
              <div key={i} className="font-hud text-sm text-hud-muted border-l-2 border-hud-border pl-3 py-0.5">{entry}</div>
            ))
          }
        </div>

        <div className="border-t border-hud-border pt-3 flex gap-2">
          <button onClick={exportLog}
            className="flex-1 border border-hud-accent text-hud-accent font-hud text-sm py-2 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-wider">
            EXPORT AS TEXT
          </button>
          <button onClick={() => setOpen(false)}
            className="border border-hud-border text-hud-muted font-hud text-sm px-4 hover:border-hp-low hover:text-hp-low transition-colors">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
