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

  const lootChar = characters.find(c => c.id === lootModalCharId)
  const editChar = characters.find(c => c.id === editCharId)
  const statusChar = characters.find(c => c.id === statusModalCharId)
  const inspectChar = inspectCharId ? characters.find(c => c.id === inspectCharId) ?? null : null

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
              onInspect={setInspectCharId}
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

      {inspectChar && (
        <InspectModal
          character={inspectChar}
          onClose={() => setInspectCharId(null)}
        />
      )}
    </div>
  )
}
