import type { FC } from 'react'

interface HPBarProps {
  current: number
  max: number
  className?: string
  showLabel?: boolean
}

export const HPBar: FC<HPBarProps> = ({ current, max, className = '', showLabel = false }) => {
  const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0
  const colour = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444'
  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm font-hud text-hud-muted mb-1">
          <span>HP</span><span>{current}/{max}</span>
        </div>
      )}
      <div className="w-full h-2 bg-hud-border">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${pct * 100}%`, backgroundColor: colour }}
        />
      </div>
    </div>
  )
}
