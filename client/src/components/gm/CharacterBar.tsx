import { useState } from 'react'
import type { Character, WSMessage, LootBox } from '../../types'
import { CharacterCard } from './CharacterCard'
import { LootAssignModal } from './LootAssignModal'
import { StatusEffectModal } from './StatusEffectModal'
import { CharacterCreateModal } from './CharacterCreateModal'
import { CharacterEditModal } from './CharacterEditModal'

interface CharacterBarProps {
  characters: Character[]
  lootQueue: LootBox[]
  send: (msg: WSMessage) => void
}

export function CharacterBar({ characters, lootQueue, send }: CharacterBarProps) {
  const [lootModalCharId, setLootModalCharId] = useState<string | null>(null)
  const [statusModalCharId, setStatusModalCharId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editCharId, setEditCharId] = useState<string | null>(null)

  const lootChar = characters.find(c => c.id === lootModalCharId)
  const editChar = characters.find(c => c.id === editCharId)
  const statusChar = characters.find(c => c.id === statusModalCharId)

  return (
    <div className="border-b border-hud-border bg-hud-panel p-3">
      <div className="flex justify-between items-center mb-2">
        <div className="font-hud text-sm text-hud-muted tracking-widest">CRAWLER STATUS</div>
        <button onClick={() => setShowCreate(true)}
          className="font-hud text-xs border border-hud-border text-hud-muted px-3 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider">
          + ADD CRAWLER
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 flex-wrap sm:flex-nowrap">
        {characters.length === 0
          ? <p className="font-hud text-hud-muted text-sm italic">No crawlers registered. Add one to begin.</p>
          : characters.map(c => (
            <CharacterCard
              key={c.id}
              character={c}
              pendingLootBoxes={lootQueue.filter(b => b.assignedTo === c.id && b.state === 'pending')}
              send={send}
              onLootAssign={setLootModalCharId}
              onStatusEffects={setStatusModalCharId}
              onEdit={setEditCharId}
            />
          ))
        }
      </div>

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
    </div>
  )
}
