import { useState } from 'react'
import type { Character, WSMessage, LootBox } from '../../types'
import type { DirectMessage } from '../../hooks/useWebSocket'
import { CharacterCard } from './CharacterCard'
import { LootAssignModal } from './LootAssignModal'
import { StatusEffectModal } from './StatusEffectModal'
import { CharacterCreateModal } from './CharacterCreateModal'
import { CharacterEditModal } from './CharacterEditModal'
import { InspectModal } from '../shared/InspectModal'
import { DMPanel } from '../shared/DMPanel'

interface CharacterBarProps {
  characters: Character[]
  lootQueue: LootBox[]
  send: (msg: WSMessage) => void
  dmMessages: DirectMessage[]
  onDMRead: () => void
}

export function CharacterBar({ characters, lootQueue, send, dmMessages, onDMRead }: CharacterBarProps) {
  const [lootModalCharId, setLootModalCharId] = useState<string | null>(null)
  const [statusModalCharId, setStatusModalCharId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editCharId, setEditCharId] = useState<string | null>(null)
  const [inspectCharId, setInspectCharId] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [optimisticActive, setOptimisticActive] = useState<Record<string, boolean>>({})

  const handleToggleActive = async (id: string, newActive: boolean) => {
    setOptimisticActive(prev => ({ ...prev, [id]: newActive }))
    try {
      await fetch(`/api/characters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive })
      })
      send({ type: 'full_state_sync_request' } as any)
    } catch (e) {
      console.error(e)
      setOptimisticActive(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const displayCharacters = characters.map(c => {
    if (optimisticActive[c.id] !== undefined) {
      return { ...c, isActive: optimisticActive[c.id] }
    }
    return c
  })

  const activeCharacters = displayCharacters.filter(c => c.isActive !== false)
  const inactiveCharacters = displayCharacters.filter(c => c.isActive === false)

  const lootChar = displayCharacters.find(c => c.id === lootModalCharId)
  const editChar = displayCharacters.find(c => c.id === editCharId)
  const statusChar = displayCharacters.find(c => c.id === statusModalCharId)
  const inspectChar = inspectCharId ? displayCharacters.find(c => c.id === inspectCharId) ?? null : null

  return (
    <div className="border-b border-hud-border bg-hud-panel p-3 flex-shrink-0">
      <div className="flex justify-between items-center mb-2">
        <div className="font-hud text-sm text-hud-muted tracking-widest">CRAWLER STATUS</div>
        <div className="flex gap-2 items-center">
          <DMPanel
            mode="gm"
            characters={characters}
            messages={dmMessages}
            send={send}
            onRead={onDMRead}
          />
          <button onClick={() => setShowCreate(true)}
            className="font-hud text-xs border border-hud-border text-hud-muted px-3 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider">
            + ADD CRAWLER
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 flex-wrap sm:flex-nowrap">
        {activeCharacters.length === 0
          ? <p className="font-hud text-hud-muted text-sm italic">No active crawlers.</p>
          : activeCharacters.map(c => (
            <div key={c.id} className="relative group flex flex-col gap-1">
              <CharacterCard
                character={c}
                pendingLootBoxes={lootQueue.filter(b => b.assignedTo === c.id && b.state === 'pending')}
                send={send}
                onLootAssign={setLootModalCharId}
                onStatusEffects={setStatusModalCharId}
                onEdit={setEditCharId}
                onInspect={setInspectCharId}
              />
              <button onClick={() => handleToggleActive(c.id, false)}
                className="font-hud text-xs border border-hud-border text-hud-muted hover:border-red-800 hover:text-red-400 py-1 transition-colors">
                HIDE (DEACTIVATE)
              </button>
            </div>
          ))
        }
      </div>

      {inactiveCharacters.length > 0 && (
        <div className="mt-3 border-t border-hud-border pt-2">
          <button
            onClick={() => setShowInactive(p => !p)}
            className="font-hud text-xs text-hud-muted tracking-widest opacity-50 hover:opacity-100 transition-opacity flex items-center gap-2"
          >
            <span>{showInactive ? '▾' : '▸'}</span>
            <span>INACTIVE CRAWLERS ({inactiveCharacters.length})</span>
          </button>
          {showInactive && (
            <div className="flex gap-3 overflow-x-auto pb-1 flex-wrap sm:flex-nowrap mt-2 opacity-50 hover:opacity-100 transition-opacity">
              {inactiveCharacters.map(c => (
                <div key={c.id} className="relative group flex flex-col gap-1 grayscale scale-95 origin-top">
                  <CharacterCard
                    character={c}
                    pendingLootBoxes={lootQueue.filter(b => b.assignedTo === c.id && b.state === 'pending')}
                    send={send}
                    onLootAssign={setLootModalCharId}
                    onStatusEffects={setStatusModalCharId}
                    onEdit={setEditCharId}
                    onInspect={setInspectCharId}
                  />
                  <button onClick={() => handleToggleActive(c.id, true)}
                    className="font-hud text-xs border border-hud-border text-hud-muted hover:border-green-800 hover:text-green-400 py-1 transition-colors">
                    SHOW (ACTIVATE)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {lootModalCharId && lootChar && (
        <LootAssignModal
          characterId={lootModalCharId}
          characterName={lootChar.crawlerName}
          onClose={() => setLootModalCharId(null)}
          send={send}
        />
      )}

      {statusModalCharId && statusChar && (
        <StatusEffectModal
          characterId={statusModalCharId}
          characterName={statusChar.crawlerName}
          currentEffects={statusChar.statusEffects as any[]}
          onClose={() => setStatusModalCharId(null)}
          send={send}
        />
      )}

      {editCharId && editChar && (
        <CharacterEditModal
          character={editChar}
          onClose={() => setEditCharId(null)}
          send={send}
        />
      )}

      {showCreate && (
        <CharacterCreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {}}
          send={send}
        />
      )}

      {inspectChar && (
        <InspectModal
          character={inspectChar}
          onClose={() => setInspectCharId(null)}
        />
      )}
    </div>
  )
}
