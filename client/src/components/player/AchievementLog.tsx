import { tierColour } from '../../utils/colours'
import { useState } from 'react'
import type { Achievement } from '../../types'


function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

export function AchievementLog({ achievements }: { achievements: Achievement[] }) {
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const sorted = [...achievements].sort((a, b) => b.unlockedAt - a.unlockedAt)

  if (sorted.length === 0) return (
    <p className="font-hud text-sm text-hud-muted italic">
      No achievements yet. The System is watching. Do better.
    </p>
  )

  return (
    <div className="flex flex-col gap-2">
      {sorted.map(a => {
        const isNew = a.isNew && !seen.has(a.id)
        const colour = tierColour(a.tier) ?? '#9CA3AF'
        return (
          <div key={a.id} onClick={() => setSeen(p => new Set([...p, a.id]))}
            className="border p-2 cursor-pointer transition-all"
            style={{
              borderColor: colour,
              boxShadow: isNew ? `0 0 8px ${colour}66` : 'none'
            }}>
            <div className="flex justify-between items-center">
              <span className="font-hud text-sm px-1 border" style={{ borderColor: colour, color: colour }}>
                {a.tier.toUpperCase()}
              </span>
              {isNew && <span className="font-hud text-sm text-yellow-400 animate-pulse">NEW</span>}
              <span className="font-hud text-sm text-hud-muted">{timeAgo(a.unlockedAt)}</span>
            </div>
            <div className="font-hud text-sm mt-1" style={{ color: colour }}>{a.name}</div>
            <div className="font-hud text-sm text-hud-muted mt-0.5">{a.description}</div>
          </div>
        )
      })}
    </div>
  )
}
