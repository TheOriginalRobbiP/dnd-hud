import React, { useRef } from 'react'
import type { Character, Mob } from '../../types'

interface BattlemapProps {
  mapUrl: string | null
  characters: Character[]
  activeMobs: Mob[]
  isEditable: boolean // True for GM dashboard
  myCharacterId?: string // Set for Player HUD to restrict moving other tokens
  activeCharIds?: string[] // Track currently connected active crawlers to avoid offline ones
  onTokenMove: (id: string, isMob: boolean, posX: number, posY: number) => void
}

export function Battlemap({
  mapUrl,
  characters,
  activeMobs,
  isEditable,
  myCharacterId,
  activeCharIds,
  onTokenMove,
}: BattlemapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string, isMob: boolean) => {
    const isPlayerOwnToken = myCharacterId && id === myCharacterId && !isMob
    const canDrag = isEditable || isPlayerOwnToken

    if (!canDrag) return

    e.preventDefault()
    e.stopPropagation()

    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)

    const container = containerRef.current
    if (!container) return

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      
      // Calculate coordinates relative to the map container (0% - 100%)
      const x = ((moveEvent.clientX - rect.left) / rect.width) * 100
      const y = ((moveEvent.clientY - rect.top) / rect.height) * 100
      
      // Clamp coordinates to remain within map boundaries
      const clampedX = Math.max(2, Math.min(98, x))
      const clampedY = Math.max(2, Math.min(98, y))

      onTokenMove(id, isMob, parseFloat(clampedX.toFixed(1)), parseFloat(clampedY.toFixed(1)))
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId)
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerup', handlePointerUp)
    }

    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0a0a0c] border border-hud-border rounded-lg overflow-hidden select-none touch-none"
    >
      {/* Dynamic scanlines & retro grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-10"
        style={{
          backgroundSize: '30px 30px',
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
        }}
      />
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

      {/* Map Background Artwork */}
      {mapUrl ? (
        <img
          src={mapUrl}
          alt="Battlemap"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-all duration-300 opacity-80"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-hud-muted font-hud p-6 text-center">
          <span className="text-3xl mb-3">🗺️</span>
          <div className="text-xs uppercase tracking-[0.2em]">Awaiting Battlemap Telemetry</div>
          <div className="text-[10px] opacity-40 mt-1 max-w-[280px]">
            Assign a "Flavour Art URL" in the Room Inspector to render a high-definition tactical background.
          </div>
        </div>
      )}

      {/* Render Active Character Tokens */}
      {characters
        .filter((c) => c.isActive && c.isAlive && (!activeCharIds || activeCharIds.includes(c.id)))
        .map((c) => {
          const isOwn = c.id === myCharacterId
          const posX = c.tokenPosX ?? 50
          const posY = c.tokenPosY ?? 50
          const canDrag = isEditable || isOwn

          return (
            <div
              key={c.id}
              onPointerDown={(e) => handlePointerDown(e, c.id, false)}
              style={{
                left: `${posX}%`,
                top: `${posY}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute z-20 flex flex-col items-center group transition-all duration-150 ease-out select-none ${
                canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              }`}
            >
              {/* Token Border/Glow */}
              <div
                className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full border-2 bg-hud-panel flex items-center justify-center transition-all ${
                  isOwn
                    ? 'border-hud-accent shadow-[0_0_12px_rgba(245,158,11,0.5)] ring-2 ring-hud-accent/30'
                    : 'border-hud-success shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                } group-hover:scale-105`}
              >
                {/* Character Portrait */}
                {c.portrait ? (
                  <img
                    src={c.portrait}
                    alt={c.crawlerName}
                    className="w-full h-full rounded-full object-cover select-none pointer-events-none"
                  />
                ) : (
                  <div className="text-hud-muted font-bold font-hud text-lg select-none">
                    {c.crawlerName[0]}
                  </div>
                )}

                {/* HP percentage overlay badge */}
                <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 bg-hud-bg border border-hud-border rounded-full px-1.5 py-0.5 text-[9px] font-bold font-hud flex items-center gap-0.5 shadow-md">
                  <span className="text-hud-success">{c.hp}</span>
                  <span className="opacity-30">/</span>
                  <span className="text-hud-muted">{c.maxHp}</span>
                </div>
              </div>

              {/* Character Nameplate */}
              <div className="mt-2.5 bg-black/75 border border-hud-border rounded px-1.5 py-0.5 pointer-events-none shadow-sm flex items-center justify-center max-w-[100px]">
                <span className="font-hud text-[9px] md:text-[10px] font-bold tracking-wider text-hud-text truncate">
                  {c.crawlerName.toUpperCase()}
                </span>
              </div>
            </div>
          )
        })}

      {/* Render Active Threat Tokens */}
      {activeMobs.map((mob) => {
        const posX = mob.posX ?? 50
        const posY = mob.posY ?? 50
        const hpPercent = Math.max(0, Math.min(100, (mob.hp / mob.maxHp) * 100))
        const isElite = mob.maxHp >= 20
        const isBoss = mob.maxHp >= 40

        return (
          <div
            key={mob.id}
            onPointerDown={(e) => handlePointerDown(e, mob.id, true)}
            style={{
              left: `${posX}%`,
              top: `${posY}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute z-20 flex flex-col items-center group transition-all duration-150 ease-out select-none ${
              isEditable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            }`}
          >
            {/* Mob Token Border */}
            <div
              className={`relative w-11 h-11 md:w-13 md:h-13 rounded-full border-2 bg-hud-panel flex items-center justify-center transition-all ${
                isBoss
                  ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)] ring-2 ring-red-600/30'
                  : isElite
                  ? 'border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.4)]'
                  : 'border-zinc-500 shadow-md'
              } group-hover:scale-105`}
            >
              {/* Crimson icon */}
              <div className="text-red-500 font-hud text-lg md:text-xl font-bold pointer-events-none select-none">
                {isBoss ? '👹' : isElite ? '💀' : '👾'}
              </div>

              {/* HP Bar */}
              <div className="absolute -bottom-1.5 w-[90%] h-1.5 bg-black/80 border border-hud-border rounded-sm overflow-hidden p-0.5 shadow-md">
                <div
                  className="h-full bg-red-600 rounded-sm"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Mob Nameplate */}
            <div className="mt-2 bg-red-950/80 border border-red-900 rounded px-1.5 py-0.5 pointer-events-none shadow-sm max-w-[100px] flex items-center justify-center">
              <span className="font-hud text-[9px] font-bold tracking-wide text-red-300 truncate">
                {mob.name.toUpperCase()}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
