import type { FC } from 'react'

interface HPBarProps {
  current: number
  max: number
  className?: string
  showLabel?: boolean
}

export const HPBar: FC<HPBarProps> = ({ current, max, className = '', showLabel = false }) => {
  const numHearts = Math.ceil(max / 10)
  const hearts = []

  for (let i = 0; i < numHearts; i++) {
    // Calculate HP in this specific heart container (0 to 10)
    const heartHp = Math.max(0, Math.min(10, current - i * 10))
    const fillPercent = (heartHp / 10) * 100
    
    // Check if this represents a partial container at max health (e.g. if max is 15, heart 2 is only 50% full at max)
    const isPartialMax = i === numHearts - 1 && max % 10 !== 0
    const partialMaxCap = isPartialMax ? max % 10 : 10

    hearts.push({
      id: i,
      fillPercent,
      isPartialMax,
      partialMaxCap,
    })
  }

  // Calculate critical health status (under 25% overall)
  const isCritical = max > 0 && (current / max) <= 0.25

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-[10px] font-hud text-hud-muted tracking-wider">
          <span>HEALTH (HEARTS)</span>
          <span>{current}/{max} HP</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1 items-center">
        {hearts.map(heart => {
          // Unique ID for the horizontal clip path
          const clipId = `heart-clip-${heart.id}-${current}-${max}`
          
          // Glowing/Pulsing effects on critical, standard vibrant red otherwise
          const strokeColor = isCritical ? '#ef4444' : 'currentColor'
          const fillColor = isCritical ? '#ef4444' : '#dc2626'

          return (
            <div 
              key={heart.id} 
              className="relative flex-shrink-0"
              title={`Heart Container ${heart.id + 1}: ${Math.max(0, Math.min(10, current - heart.id * 10))}/${heart.isPartialMax ? heart.partialMaxCap : 10} HP`}
            >
              <svg 
                viewBox="0 0 24 24" 
                className={`w-5 h-5 md:w-6 md:h-6 transition-transform duration-200 hover:scale-110 ${isCritical ? 'animate-pulse text-red-500' : 'text-hud-accent/60'}`}
                style={{ filter: isCritical ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))' : 'none' }}
              >
                <defs>
                  <clipPath id={clipId}>
                    <rect x="0" y="0" width={`${heart.fillPercent}%`} height="100%" />
                  </clipPath>
                </defs>
                
                {/* Empty container background (dark and framed) */}
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="#0b0b0d"
                  stroke={strokeColor}
                  strokeWidth="2"
                />

                {/* Filled heart layer (clipped dynamically from left to right) */}
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill={fillColor}
                  clipPath={`url(#${clipId})`}
                />
              </svg>
            </div>
          )
        })}
      </div>
    </div>
  )
}
