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
import { DiceHero } from './DiceHero'
import { PartySidebar } from './PartySidebar'

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
    <div className="h-screen flex flex-col bg-hud-bg overflow-hidden font-sans" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Mobile-only Header */}
      <div className="md:hidden border-b border-hud-border px-4 py-4 flex items-center justify-between bg-hud-panel">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.removeItem('hud:role')
              window.location.reload()
            }}
            title="Switch Role / Logout"
            className="w-8 h-8 flex items-center justify-center border border-hud-border rounded text-hud-muted hover:border-red-500 hover:text-red-500 transition-colors"
          >
            ⏏
          </button>
          <div>
            <div className={`text-[22px] font-extrabold leading-none tracking-tight ${character.isAlive ? 'text-hud-text' : 'text-red-500'}`}>
              {character.isAlive ? character.crawlerName.toUpperCase() : `☠ ${character.crawlerName.toUpperCase()}`}
            </div>
            <div className="text-hud-accent text-[11px] font-bold mt-1 tracking-widest uppercase">
              LVL {(character as any).level || 2} {(character as any).class || 'CRAWLER'}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-[11px]">
          <DMPanel mode="player" myCharId={character.id} myName={character.crawlerName} messages={dmMessages} send={send} onRead={onDMRead} onEcho={onDMEcho} />
          <div className="font-bold tracking-widest text-hud-success">HP {character.hp}/{character.maxHp}</div>
          <div className="font-bold tracking-widest text-hud-muted">TGT {state.floor.roomTarget}</div>
        </div>
      </div>

      {/* Desktop-only hidden header logic would go here if we had one, but we use a distinct grid for desktop */}
      <div className="hidden md:flex items-center justify-between p-2 border-b border-hud-border bg-hud-panel">
        <div className="flex items-center gap-4 px-2">
          <button
            onClick={() => {
              localStorage.removeItem('hud:role')
              window.location.reload()
            }}
            title="Switch Role / Logout"
            className="font-hud text-xs border border-hud-border text-hud-muted px-2 py-0.5 hover:border-red-500 hover:text-red-500 transition-colors"
          >
            ⏏ SWITCH CRAWLER
          </button>
          <div className="font-hud text-sm text-hud-accent tracking-widest">
            {character.isAlive ? character.crawlerName.toUpperCase() : `☠ ${character.crawlerName.toUpperCase()}`}
          </div>
        </div>
        <div className="flex items-center gap-3 pr-2">
          <DMPanel mode="player" myCharId={character.id} myName={character.crawlerName} messages={dmMessages} send={send} onRead={onDMRead} onEcho={onDMEcho} />
          <div className="font-hud text-sm text-hud-muted">
            TARGET {state.floor.roomTarget}
          </div>
        </div>
      </div>
      {/* Main Area */}
      <div className="flex-1 overflow-y-auto bg-hud-bg pb-20 md:pb-0">
        {/* Desktop Grid Layout [280px_1fr_350px] (Always active on md+ breakpoint regardless of mobile tab) */}
        <div className="md:grid md:grid-cols-[280px_1fr_350px] md:h-full h-full">
          
          {/* Left Column - Always active on mobile for all tabs, acts as left rail on desktop */}
          <div className="md:border-r md:border-hud-border md:overflow-y-auto h-full">
            <div className={tab === 'status' ? 'block' : 'hidden md:block'}>
              <StatusTab character={character} floor={state.floor} allCharacters={state.characters} onInspect={setInspectCharId} />
            </div>
            <div className={tab === 'skills' ? 'block' : 'hidden'}>
              <SkillsTab character={character} />
            </div>
            <div className={tab === 'inventory' ? 'block' : 'hidden'}>
              <InventoryTab character={character} lootQueue={state.lootQueue} send={send} onCharacterUpdate={() => send({ type: 'full_state_sync_request' } as any)} />
            </div>
            <div className={tab === 'fame' ? 'block' : 'hidden md:hidden'}>
              <FameTab character={character} floorNumber={state.floor.floorNumber} />
            </div>
          </div>
          
          {/* Desktop-only Middle Column (Hero Dice Roller & Skills) */}
          <div className="hidden md:flex md:flex-col md:p-8 md:gap-8 md:overflow-y-auto bg-hud-bg">
             <div className="bg-hud-panel border border-hud-border rounded-xl p-8 relative overflow-hidden" style={{ minHeight: '200px' }}>
                <div className="absolute inset-0 opacity-10 bg-hud-accent mix-blend-overlay"></div>
                <div className="relative z-10 flex justify-between items-center h-full">
                  <div>
                    <div className="font-sans font-extrabold text-3xl text-hud-text tracking-widest uppercase mb-2">
                      {(state.floor as any).currentRoomData?.roomName || "Floor 1: The Drop"}
                    </div>
                    <div className="font-mono text-sm text-hud-muted tracking-[0.1em] uppercase">
                      {(state.floor as any).currentRoomData?.theme || "Dungeon Start"}
                    </div>
                  </div>
                </div>
             </div>
             
             {/* Middle column contains the dice roller + skills on desktop */}
             <div className="flex-1 flex flex-col gap-8">
               <DiceHero character={character} floor={state.floor} send={send} />
               
               <div className="bg-hud-panel border border-hud-border rounded-xl p-6">
                 <div className="font-mono text-xs text-hud-muted tracking-[0.2em] mb-4 uppercase border-b border-hud-border pb-2">Skills & Abilities</div>
                 <SkillsTab character={character} />
               </div>
             </div>
          </div>

        {/* Desktop-only Right Column (Fame, Inventory, Party) */}
          <div className="hidden md:flex md:flex-col md:border-l md:border-hud-border md:overflow-y-auto md:bg-hud-panel">
             <div className="flex-1 overflow-y-auto flex flex-col">
               {/* Right column handles Party, Inventory, Fame directly inline */}
               <div className="p-4 border-b border-hud-border">
                 <PartySidebar characters={state.characters} myCharId={character.id} onInspect={setInspectCharId} />
               </div>
               
               <div className="p-4 border-b border-hud-border">
                 <InventoryTab character={character} lootQueue={state.lootQueue} send={send} onCharacterUpdate={() => send({ type: 'full_state_sync_request' } as any)} />
               </div>

               <div className="p-4">
                 <FameTab character={character} floorNumber={state.floor.floorNumber} />
               </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Mobile-only Bottom Nav */}
      <div className="md:hidden flex border-t border-hud-border bg-hud-bg py-4 pb-8 fixed bottom-0 left-0 right-0 z-50">
        {TABS.filter(t => t.id !== 'rules').map(t => {
          let icon = "📊"
          if (t.id === 'skills') icon = "⚔️"
          if (t.id === 'inventory') icon = "🎒"
          if (t.id === 'fame') icon = "⭐"

          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1.5 transition-colors ${
                tab === t.id ? 'text-hud-accent' : 'text-hud-muted hover:text-hud-text'
              }`}>
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-bold tracking-widest">{t.label}</span>
            </button>
          )
        })}
      </div>

      <ToastOverlay toasts={toasts} onDismiss={dismiss} />
      {inspectChar && <InspectModal character={inspectChar} onClose={() => setInspectCharId(null)} hideNotes />}
    </div>
  )
}
