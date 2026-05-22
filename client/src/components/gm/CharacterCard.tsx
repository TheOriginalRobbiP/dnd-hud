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
    <div className={`border ${borderCol} bg-hud-panel p-4 w-full sm:min-w-[220px] sm:w-auto flex flex-col gap-2 transition-colors rounded-lg`}>
      {/* Portrait + Header */}
      <div className="flex gap-3 items-start mb-1">
        {portrait ? (
          <>
            <div className="relative w-10 h-14 overflow-hidden border border-hud-border flex-shrink-0 bg-black/20 rounded">
              <img
                src={portrait}
                alt={crawlerName}
                className={`w-full h-full object-contain transition-all duration-300 ${!isAlive ? 'grayscale opacity-40' : ''}`}
                style={{ objectPosition: 'center' }}
              />
              {!isAlive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded">
                  <span className="text-xl">☠</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-14">
              <div>
                <div className={`font-hud text-sm tracking-wider uppercase truncate ${isAlive ? 'text-hud-accent' : 'text-red-400'}`}>
                  {crawlerName}
                </div>
                <div className="font-hud text-xs text-hud-muted truncate">{playerName}</div>
              </div>
              <div className="font-hud text-xs text-hud-muted flex items-center gap-1">
                <span>👁</span>
                <span>{viewerCount.toLocaleString()}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex justify-between items-start gap-2">
            <div>
              <div className={`font-hud text-sm tracking-wider uppercase ${isAlive ? 'text-hud-accent' : 'text-red-400'}`}>
                {!isAlive && '☠ '}{crawlerName}
              </div>
              <div className="font-hud text-xs text-hud-muted">{playerName}</div>
            </div>
            <div className="font-hud text-xs text-hud-muted flex items-center gap-1 flex-shrink-0">
              <span>👁</span>
              <span>{viewerCount.toLocaleString()}</span>
            </div>
          </div>
        )}
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
          <div className="w-full h-3 bg-hud-border rounded-sm overflow-hidden">
            <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${(mp/maxMp)*100}%` }} />
          </div>
        </div>
      )}

      {/* Conditions & AI Favour */}
      <div className="flex items-center justify-between border-t border-hud-border/40 pt-2 mt-1">
        <div className="flex gap-1">
          <button onClick={() => onStatusEffects(id)}
            className="font-hud text-[10px] border border-hud-border text-hud-muted px-2 py-0.5 hover:border-hud-accent hover:text-hud-accent transition-colors rounded">
            CONDITIONS ({statusEffects.length})
          </button>
          <button onClick={() => onLootAssign(id)}
            className={`font-hud text-[10px] border px-2 py-0.5 transition-colors rounded ${
              pendingLootBoxes.length > 0
                ? 'border-yellow-600 bg-yellow-950/20 text-yellow-400 animate-pulse font-bold'
                : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'
            }`}>
            LOOT{pendingLootBoxes.length > 0 ? ` (${pendingLootBoxes.length})` : ''}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => adjustFavour(-1)} className="text-[10px] text-hud-muted hover:text-red-500 transition-colors">−</button>
          <span className="font-hud text-xs text-yellow-400 font-bold" title="AI Favour">⚡{aiFavour ?? 0}</span>
          <button onClick={() => adjustFavour(1)} className="text-[10px] text-hud-muted hover:text-green-500 transition-colors">+</button>
        </div>
      </div>

      {/* Edit / Inspect */}
      <div className="flex gap-1 border-t border-hud-border/40 pt-2">
        <button onClick={() => onInspect(id)}
          className="flex-1 font-hud text-[10px] border border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent py-1 transition-colors rounded text-center">
          INSPECT 🔍
        </button>
        <button onClick={() => onEdit(id)}
          className="flex-1 font-hud text-[10px] border border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent py-1 transition-colors rounded text-center">
          EDIT ⚙️
        </button>
      </div>
    </div>
  )
}