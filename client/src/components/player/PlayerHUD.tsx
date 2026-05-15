import { useState, useEffect, useRef } from 'react'
import type { Character, AppState, WSMessage } from '../../types'
import { ToastOverlay } from '../shared/ToastOverlay'
import { DMPanel } from '../shared/DMPanel'
import { InspectModal } from '../shared/InspectModal'
import type { DirectMessage } from '../../hooks/useWebSocket'
import { useToasts } from '../../hooks/useToasts'
import { StatusTab } from './StatusTab'
import { SkillsTab } from './SkillsTab'
import { InventoryTab } from './InventoryTab'
import { FameTab } from './FameTab'

type Tab = 'status' | 'skills' | 'inventory' | 'fame'
const TABS: { id: Tab; label: string }[] = [
  { id: 'status', label: 'STATUS' },
  { id: 'skills', label: 'SKILLS' },
  { id: 'inventory', label: 'INVENTORY' },
  { id: 'fame', label: 'FAME' },
]

interface PlayerHUDProps {
  character: Character
  state: AppState
  send: (msg: WSMessage) => void
  dmMessages: DirectMessage[]
  onDMRead: () => void
}

export function PlayerHUD({ character, state, send, dmMessages, onDMRead }: PlayerHUDProps) {
  const [tab, setTab] = useState<Tab>('status')
  const [inspectCharId, setInspectCharId] = useState<string | null>(null)
  const { toasts, addToast, dismiss } = useToasts()
  const prevGmLogLen = useRef(0)

  useEffect(() => {
    if (state.gmLog.length > prevGmLogLen.current) {
      const newEntries = state.gmLog.slice(prevGmLogLen.current)
      newEntries.forEach(entry => {
        const type = entry.includes('Achievement') ? 'achievement'
          : entry.includes('Loot') ? 'loot'
          : entry.includes('WARNING') || entry.includes('collapse') ? 'warning'
          : 'announcement'
        addToast(entry, type)
      })
    }
    prevGmLogLen.current = state.gmLog.length
  }, [state.gmLog, addToast])

  const inspectChar = inspectCharId ? state.characters.find(c => c.id === inspectCharId) ?? null : null

  return (

    <div className="h-screen flex flex-col bg-hud-bg overflow-hidden">
      <div className="border-b border-hud-border px-4 py-2 flex items-center justify-between bg-hud-panel">
        <div className={`font-hud tracking-widest ${character.isAlive ? 'text-hud-accent' : 'text-red-500'}`}>
          {character.isAlive ? character.crawlerName.toUpperCase() : `☠ ${character.crawlerName.toUpperCase()}`}
        </div>
        <div className="flex items-center gap-3">
          <DMPanel mode="player" myCharId={character.id} myName={character.crawlerName} messages={dmMessages} send={send} onRead={onDMRead} />
          <div className="font-hud text-sm text-hud-muted">
            HP {character.hp}/{character.maxHp} · TARGET {state.floor.roomTarget}
          </div>
        </div>
      </div>

      <div className="flex border-b border-hud-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 font-hud text-sm py-3 tracking-widest transition-colors border-b-2 ${
              tab === t.id ? 'text-hud-accent border-hud-accent' : 'text-hud-muted border-transparent hover:text-hud-text'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'status' && <StatusTab character={character} floor={state.floor} allCharacters={state.characters} onInspect={setInspectCharId} send={send} />}
        {tab === 'skills' && <SkillsTab character={character} />}
        {tab === 'inventory' && <InventoryTab
          character={character}
          lootQueue={state.lootQueue}
          send={send}
          onCharacterUpdate={() => send({ type: 'full_state_sync_request' } as any)}
        />}
        {tab === 'fame' && <FameTab character={character} floorNumber={state.floor.floorNumber} />}
      </div>
      <ToastOverlay toasts={toasts} onDismiss={dismiss} />
      {inspectChar && <InspectModal character={inspectChar} onClose={() => setInspectCharId(null)} hideNotes />}
    </div>
  )
}
