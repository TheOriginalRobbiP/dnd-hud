import { useState } from 'react'
import type { Character, WSMessage, LootBox } from '../../types'
import { HPBar } from '../shared/HPBar'

interface CharacterCardProps {
  character: Character
  pendingLootBoxes: LootBox[]
  send: (msg: WSMessage) => void
  onLootAssign: (charId: string) => void
  onStatusEffects: (charId: string) => void
  onEdit: (charId: string) => void
  onInspect: (charId: string) => void
}

export function CharacterCard({ character, pendingLootBoxes, send, onLootAssign, onStatusEffects, onEdit, onInspect }: CharacterCardProps) {
  const { id, crawlerName, playerName, hp, maxHp, mp, maxMp, isAlive, viewerCount, statusEffects } = character

  const adjust = (delta: number) => {
    const newHp = Math.max(0, Math.min(maxHp, hp + delta))
    send({ type: 'hp_update', charId: id, hp: newHp })
    if (newHp === 0 && isAlive) send({ type: 'death', charId: id })
  }

  const borderCol = isAlive ? 'border-hud-border hover:border-hud-accent' : 'border-red-900'

  return (
    <div className={`border ${borderCol} bg-hud-panel p-4 min-w-[220px] flex flex-col gap-2 transition-colors`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className={`font-hud text-sm tracking-wider ${isAlive ? 'text-hud-accent' : 'text-red-500'}`}>
            {isAlive ? crawlerName.toUpperCase() : `☠ ${crawlerName.toUpperCase()}`}
          </div>
          <div className="font-hud text-sm text-hud-muted">{playerName}</div>
        </div>
        <div className="font-hud text-sm text-hud-muted">👁 {viewerCount.toLocaleString()}</div>
      </div>

      {/* HP */}
      <div>
        <div className="flex justify-between text-sm font-hud text-hud-muted mb-1">
          <span>HP</span><span>{hp}/{maxHp}</span>
        </div>
        <HPBar current={hp} max={maxHp} />
      </div>

      {/* HP controls */}
      <div className="flex gap-1">
        {[-5,-1,1,5].map(d => (
          <button key={d}
            onClick={() => adjust(d)}
            className="flex-1 border border-hud-border font-hud text-sm py-1 hover:border-hud-accent hover:text-hud-accent transition-colors text-hud-muted"
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      {/* MP */}
      {maxMp > 0 && (
        <div>
          <div className="flex justify-between text-sm font-hud text-hud-muted mb-1">
            <span>MP</span><span>{mp}/{maxMp}</span>
          </div>
          <div className="w-full h-1 bg-hud-border">
            <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${maxMp > 0 ? (mp/maxMp)*100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Status effects */}
      {statusEffects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {statusEffects.map((e: any) => (
            <span key={e.id} className={`text-sm font-hud px-1 border ${e.type === 'buff' ? 'border-green-800 text-green-400' : 'border-red-900 text-red-400'}`}>
              {e.name}
            </span>
          ))}
        </div>
      )}

      {/* Revive button — only shown when dead */}
      {!isAlive && (
        <button onClick={() => send({ type: 'revive', charId: id, hp: Math.ceil(maxHp / 2) })}
          className="w-full border border-green-800 text-green-400 font-hud text-sm py-2 hover:border-green-600 hover:bg-green-950 transition-colors tracking-wider">
          ↑ REVIVE ({Math.ceil(maxHp / 2)} HP)
        </button>
      )}

      {/* Action buttons */}
      <div className="flex gap-1 mt-1">
        <button onClick={() => onLootAssign(id)}
          aria-label="Assign loot box"
          className="flex-1 border border-hud-border text-sm font-hud py-2 hover:border-yellow-600 hover:text-yellow-400 transition-colors text-hud-muted relative">
          🎁 {pendingLootBoxes.length > 0 && <span className="absolute -top-1 -right-1 bg-yellow-600 text-black text-sm w-4 h-4 flex items-center justify-center font-bold">{pendingLootBoxes.length}</span>}
        </button>
        <button onClick={() => onStatusEffects(id)}
          aria-label="Manage status effects"
          className="flex-1 border border-hud-border text-sm font-hud py-2 hover:border-purple-600 hover:text-purple-400 transition-colors text-hud-muted">
          ⚡
        </button>
        <button onClick={() => onEdit(id)}
          aria-label="Edit character"
          className="flex-1 border border-hud-border text-sm font-hud py-2 hover:border-hud-accent hover:text-hud-accent transition-colors text-hud-muted">
          ✎
        </button>
        <button onClick={() => onInspect(id)}
          aria-label="Inspect character"
          className="flex-1 border border-hud-border text-sm font-hud py-2 hover:border-cyan-700 hover:text-cyan-400 transition-colors text-hud-muted">
          🔍
        </button>
      </div>
    </div>
  )
}
