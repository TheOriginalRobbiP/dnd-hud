import { useState } from 'react'
import type { Character, WSMessage, LootBox } from '../../types'
import { HPBar } from '../shared/HPBar'
import { getCrawlerPortrait } from '../../utils/portraits'

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
  const { id, crawlerName, playerName, hp, maxHp, mp, maxMp, isAlive, viewerCount, statusEffects, aiFavour } = character

  const [editingHp, setEditingHp] = useState(false)
  const [hpInput, setHpInput] = useState('')
  const [editingMp, setEditingMp] = useState(false)
  const [mpInput, setMpInput] = useState('')

  const setHp = (newHp: number) => {
    const clamped = Math.max(0, Math.min(maxHp, newHp))
    send({ type: 'hp_update', charId: id, hp: clamped })
    if (clamped === 0 && isAlive) send({ type: 'death', charId: id })
  }

  const setMp = (newMp: number) => {
    const clamped = Math.max(0, Math.min(maxMp, newMp))
    send({ type: 'mp_update', charId: id, mp: clamped })
  }

  const commitHp = () => {
    const parsed = parseInt(hpInput, 10)
    if (!isNaN(parsed)) setHp(parsed)
    setEditingHp(false)
  }

  const commitMp = () => {
    const parsed = parseInt(mpInput, 10)
    if (!isNaN(parsed)) setMp(parsed)
    setEditingMp(false)
  }

  const adjustFavour = (delta: number) => {
    send({ type: 'ai_favour_update', charId: id, delta })
  }

  const borderCol = isAlive ? 'border-hud-border hover:border-hud-accent' : 'border-red-900'
  const portrait = getCrawlerPortrait(crawlerName, character.portrait)

  const quickBtnCls = 'h-6 w-6 text-xs border border-hud-border font-hud flex items-center justify-center hover:border-hud-accent hover:text-hud-accent transition-colors text-hud-muted leading-none'

  return (
    <div className={`border ${borderCol} bg-hud-panel p-4 w-full sm:min-w-[220px] sm:w-auto flex flex-col gap-2 transition-colors`}>
      {/* Portrait + Header */}
      {portrait && (
        <div className="relative w-full h-36 overflow-hidden border border-hud-border mb-1">
          <img
            src={portrait}
            alt={crawlerName}
            className={`w-full h-full object-cover object-center transition-all duration-300 ${!isAlive ? 'grayscale opacity-40' : ''}`}
            style={{ objectPosition: '50% 15%' }}
          />
          {!isAlive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">☠</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-hud-bg/90 to-transparent px-2 py-1">
            <div className={`font-hud text-xs tracking-widest ${isAlive ? 'text-hud-accent' : 'text-red-400'}`}>
              {crawlerName.toUpperCase()}
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
          {!portrait && (
            <div className={`font-hud text-sm tracking-wider ${isAlive ? 'text-hud-accent' : 'text-red-500'}`}>
              {isAlive ? crawlerName.toUpperCase() : `☠ ${crawlerName.toUpperCase()}`}
            </div>
          )}
          <div className="font-hud text-sm text-hud-muted">{playerName}</div>
        </div>
        <div className="font-hud text-sm text-hud-muted">👁 {viewerCount.toLocaleString()}</div>
      </div>

      {/* HP */}
      <div>
        <div className="flex items-center justify-between text-sm font-hud text-hud-muted mb-1">
          <span>HP</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setHp(hp - 1)} className={quickBtnCls}>−</button>
            {editingHp ? (
              <input
                type="number"
                value={hpInput}
                autoFocus
                onChange={e => setHpInput(e.target.value)}
                onBlur={commitHp}
                onKeyDown={e => { if (e.key === 'Enter') commitHp(); if (e.key === 'Escape') setEditingHp(false) }}
                className="w-12 text-center font-hud text-sm bg-transparent border-b border-hud-accent text-hud-accent outline-none"
              />
            ) : (
              <button
                onClick={() => { setHpInput(String(hp)); setEditingHp(true) }}
                className="w-12 text-center font-hud text-sm text-hud-muted hover:text-hud-accent transition-colors"
                title="Click to edit HP"
              >
                {hp}
              </button>
            )}
            <span className="text-hud-muted">/ {maxHp}</span>
            <button onClick={() => setHp(hp + 1)} className={quickBtnCls}>+</button>
          </div>
        </div>
        <HPBar current={hp} max={maxHp} />
      </div>

      {/* MP */}
      {maxMp > 0 && (
        <div>
          <div className="flex items-center justify-between text-sm font-hud text-hud-muted mb-1">
            <span>MP</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setMp(mp - 1)} className={quickBtnCls}>−</button>
              {editingMp ? (
                <input
                  type="number"
                  value={mpInput}
                  autoFocus
                  onChange={e => setMpInput(e.target.value)}
                  onBlur={commitMp}
                  onKeyDown={e => { if (e.key === 'Enter') commitMp(); if (e.key === 'Escape') setEditingMp(false) }}
                  className="w-12 text-center font-hud text-sm bg-transparent border-b border-hud-accent text-hud-accent outline-none"
                />
              ) : (
                <button
                  onClick={() => { setMpInput(String(mp)); setEditingMp(true) }}
                  className="w-12 text-center font-hud text-sm text-hud-muted hover:text-hud-accent transition-colors"
                  title="Click to edit MP"
                >
                  {mp}
                </button>
              )}
              <span className="text-hud-muted">/ {maxMp}</span>
              <button onClick={() => setMp(mp + 1)} className={quickBtnCls}>+</button>
            </div>
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

      {/* AI Favour */}
      <div className="border-t border-hud-border pt-2 mt-1">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[10px] font-hud text-hud-muted uppercase">⚡ AI FAVOUR</span>
          <span className="text-lg font-bold font-hud text-yellow-400 leading-none">{aiFavour ?? 0}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => adjustFavour(-1)} disabled={(aiFavour ?? 0) <= 0}
            className="flex-1 border border-hud-border font-hud text-sm py-1 hover:border-yellow-400 hover:text-yellow-400 transition-colors text-hud-muted disabled:opacity-30 disabled:hover:border-hud-border disabled:hover:text-hud-muted"
          >
            -1
          </button>
          <button onClick={() => adjustFavour(1)}
            className="flex-1 border border-hud-border font-hud text-sm py-1 hover:border-yellow-400 hover:text-yellow-400 transition-colors text-hud-muted"
          >
            +1
          </button>
        </div>
      </div>

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
          title="Assign Loot"
          className="flex-1 border border-hud-border text-sm font-hud py-1 flex flex-col items-center justify-center hover:border-yellow-600 hover:text-yellow-400 transition-colors text-hud-muted relative">
          <span>🎁</span>
          <span className="text-[9px] font-hud text-hud-muted uppercase tracking-wider mt-0.5">LOOT</span>
          {pendingLootBoxes.length > 0 && <span className="absolute -top-1 -right-1 bg-yellow-600 text-black text-sm w-4 h-4 flex items-center justify-center font-bold">{pendingLootBoxes.length}</span>}
        </button>
        <button onClick={() => onStatusEffects(id)}
          aria-label="Manage status effects"
          title="AI Favour"
          className="flex-1 border border-hud-border text-sm font-hud py-1 flex flex-col items-center justify-center hover:border-purple-600 hover:text-purple-400 transition-colors text-hud-muted">
          <span>⚡</span>
          <span className="text-[9px] font-hud text-hud-muted uppercase tracking-wider mt-0.5">FAVOUR</span>
        </button>
        <button onClick={() => onEdit(id)}
          aria-label="Edit character"
          title="Edit Notes"
          className="flex-1 border border-hud-border text-sm font-hud py-1 flex flex-col items-center justify-center hover:border-hud-accent hover:text-hud-accent transition-colors text-hud-muted">
          <span>✎</span>
          <span className="text-[9px] font-hud text-hud-muted uppercase tracking-wider mt-0.5">NOTES</span>
        </button>
        <button onClick={() => onInspect(id)}
          aria-label="Inspect character"
          title="Inspect Character"
          className="flex-1 border border-hud-border text-sm font-hud py-1 flex flex-col items-center justify-center hover:border-cyan-700 hover:text-cyan-400 transition-colors text-hud-muted">
          <span>🔍</span>
          <span className="text-[9px] font-hud text-hud-muted uppercase tracking-wider mt-0.5">INSPECT</span>
        </button>
      </div>
    </div>
  )
}
