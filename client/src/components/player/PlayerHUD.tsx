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
import { RulesTab } from './RulesTab'
import { DiceHero } from './DiceHero'

type Tab = 'status' | 'skills' | 'inventory' | 'fame' | 'rules'
const TABS: { id: Tab; label: string }[] = [
  { id: 'status', label: 'STATUS' },
  { id: 'skills', label: 'SKILLS' },
  { id: 'inventory', label: 'INVENTORY' },
  { id: 'fame', label: 'FAME' },
  { id: 'rules', label: 'RULES' },
]

interface PlayerHUDProps {
  character: Character
  state: AppState
  send: (msg: WSMessage) => void
  dmMessages: DirectMessage[]
  onDMRead: () => void
  onDMEcho: (dm: DirectMessage) => void
}

export function PlayerHUD({ character, state, send, dmMessages, onDMRead, onDMEcho }: PlayerHUDProps) {
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
    <div className="h-screen flex flex-col bg-hud-bg overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Mobile-only Header */}
      <div className="md:hidden border-b border-hud-border px-4 py-2 flex items-center justify-between bg-hud-panel">
        <div className={`font-hud tracking-widest ${character.isAlive ? 'text-hud-accent' : 'text-red-500'}`}>
          {character.isAlive ? character.crawlerName.toUpperCase() : `☠ ${character.crawlerName.toUpperCase()}`}
        </div>
        <div className="flex items-center gap-3">
          <DMPanel mode="player" myCharId={character.id} myName={character.crawlerName} messages={dmMessages} send={send} onRead={onDMRead} onEcho={onDMEcho} />
          <div className="font-hud text-sm text-hud-muted">
            HP {character.hp}/{character.maxHp} · TARGET {state.floor.roomTarget}
          </div>
        </div>
      </div>

      {/* Mobile-only Nav */}
      <div className="md:hidden flex border-b border-hud-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 font-hud text-sm py-3 tracking-widest transition-colors border-b-2 ${
              tab === t.id ? 'text-hud-accent border-hud-accent' : 'text-hud-muted border-transparent hover:text-hud-text'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Only apply the complex desktop grid when on 'status' tab (default view) */}
        <div className={tab === 'status' ? "md:grid md:grid-cols-[350px_1fr_350px] md:h-full" : "h-full"}>
          
          {/* Left/Main column - Active on mobile for all tabs, acts as left rail on desktop status */}
          <div className={tab === 'status' ? "md:border-r md:border-hud-border md:overflow-y-auto h-full" : "h-full"}>
            {tab === 'status' && <StatusTab character={character} floor={state.floor} allCharacters={state.characters} onInspect={setInspectCharId} />}
            {tab === 'skills' && <SkillsTab character={character} />}
            {tab === 'inventory' && <InventoryTab character={character} lootQueue={state.lootQueue} send={send} onCharacterUpdate={() => send({ type: 'full_state_sync_request' } as any)} />}
            {tab === 'fame' && <FameTab character={character} floorNumber={state.floor.floorNumber} />}
            {tab === 'rules' && <RulesTab />}
          </div>
          
          {/* Desktop-only Middle Column (Hero Dice Roller) */}
          {tab === 'status' && (
            <div className="hidden md:flex md:flex-col md:p-8 md:gap-8 md:overflow-y-auto bg-hud-base">
               <div className="bg-hud-panel border border-hud-border rounded-xl p-8 relative overflow-hidden" style={{ minHeight: '200px' }}>
                  <div className="absolute inset-0 opacity-10 bg-hud-accent mix-blend-overlay"></div>
                  <div className="relative z-10 flex justify-between items-center h-full">
                    <div>
                      <div className="font-hud text-4xl text-hud-accent tracking-widest uppercase mb-2">
                        {(state.floor as any).currentRoomData?.roomName || "Floor 1: The Drop"}
                      </div>
                      <div className="font-hud text-sm text-hud-muted tracking-widest uppercase">
                        {(state.floor as any).currentRoomData?.theme || "Dungeon Start"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-hud text-xs text-hud-muted tracking-widest mb-1">ROOM TARGET</div>
                      <div className="font-hud text-6xl text-hud-accent">{state.floor.roomTarget}</div>
                    </div>
                  </div>
               </div>
               <div className="flex-1 flex flex-col justify-center">
                 <DiceHero character={character} floor={state.floor} send={send} />
               </div>
            </div>
          )}

          {/* Desktop-only Right Column (Rules) */}
          {tab === 'status' && (
            <div className="hidden md:flex md:flex-col md:border-l md:border-hud-border md:overflow-y-auto md:bg-hud-panel">
               <div className="font-hud text-sm text-hud-muted tracking-widest p-4 border-b border-hud-border">RULES AND REFERENCE</div>
               <div className="flex-1 overflow-y-auto">
                 <RulesTab />
               </div>
            </div>
          )}
        </div>
      </div>
      
      <ToastOverlay toasts={toasts} onDismiss={dismiss} />
      {inspectChar && <InspectModal character={inspectChar} onClose={() => setInspectCharId(null)} hideNotes />}
    </div>
  )
}
