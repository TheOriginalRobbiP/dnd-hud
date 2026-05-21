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
import { RulesTab } from './RulesTab'
import { Hotlist } from './Hotlist'

type Tab = 'status' | 'skills' | 'fame' | 'rules'
const TABS: { id: Tab; label: string }[] = [
  { id: 'status', label: 'STATUS' },
  { id: 'skills', label: 'SKILLS' },
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
  activeCharIds: string[]
}

export function PlayerHUD({ character, state, send, dmMessages, onDMRead, onDMEcho, activeCharIds }: PlayerHUDProps) {
  const [tab, setTab] = useState<Tab>('status')
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [inspectCharId, setInspectCharId] = useState<string | null>(null)
  const { toasts, addToast, dismiss } = useToasts()
  const prevGmLogLen = useRef(0)
  const isFirstSync = useRef(true)

  useEffect(() => {
    if (state.gmLog.length > 0) {
      if (isFirstSync.current) {
        prevGmLogLen.current = state.gmLog.length
        isFirstSync.current = false
        return
      }

      if (state.gmLog.length > prevGmLogLen.current) {
        const newEntries = state.gmLog.slice(prevGmLogLen.current)
        newEntries.forEach(entry => {
          const type = entry.includes('Achievement') ? 'achievement'
            : entry.includes('Loot') ? 'loot'
            : entry.includes('WARNING') || entry.includes('collapse') ? 'warning'
            : 'announcement'
          addToast(entry, type)
        })
        prevGmLogLen.current = state.gmLog.length
      }
    }
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
        <div className="flex flex-col items-end gap-1.5 text-[11px]">
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => setShowInventoryModal(true)}
              className="font-hud text-[10px] border border-hud-border text-hud-muted px-2 py-0.5 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider flex items-center gap-1 bg-hud-bg/50 rounded"
            >
              <span>🎒</span>
              <span>INVENTORY</span>
            </button>
            <DMPanel mode="player" myCharId={character.id} myName={character.crawlerName} messages={dmMessages} send={send} onRead={onDMRead} onEcho={onDMEcho} />
          </div>
          <div className="font-bold tracking-widest text-hud-success">HP {character.hp}/{character.maxHp}</div>
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
          <button 
            onClick={() => setShowInventoryModal(true)}
            className="font-hud text-[10px] sm:text-xs border border-hud-border text-hud-muted px-2.5 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider flex items-center gap-1.5"
          >
            <span>🎒</span>
            <span>INVENTORY</span>
          </button>
          <button 
            onClick={() => setShowRulesModal(true)}
            className="font-hud text-[10px] sm:text-xs border border-hud-border text-hud-muted px-2.5 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider flex items-center gap-1.5"
          >
            <span>📜</span>
            <span>SYSTEM RULES</span>
          </button>
          <DMPanel mode="player" myCharId={character.id} myName={character.crawlerName} messages={dmMessages} send={send} onRead={onDMRead} onEcho={onDMEcho} />
        </div>
      </div>
      {/* Main Area */}
      <div className="flex-1 overflow-y-auto bg-hud-bg pb-20 md:pb-0">
        {/* Desktop Grid Layout [280px_1fr_350px] (Always active on md+ breakpoint regardless of mobile tab) */}
        <div className="md:grid md:grid-cols-[280px_1fr_350px] md:h-full h-full">
          
          {/* Left Column - Always active on mobile for all tabs, acts as left rail on desktop */}
          <div className="md:border-r md:border-hud-border md:overflow-y-auto h-full">
            <div className={tab === 'status' ? 'block' : 'hidden md:block'}>
              <StatusTab 
                character={character} 
                floor={state.floor} 
                allCharacters={state.characters} 
                activeCharIds={activeCharIds} 
                onInspect={setInspectCharId} 
                send={send}
                onCharacterUpdate={() => send({ type: 'full_state_sync_request' } as any)}
              />
            </div>
            <div className={tab === 'skills' ? 'block' : 'hidden'}>
              <SkillsTab character={character} />
            </div>
            <div className={tab === 'fame' ? 'block' : 'hidden md:hidden'}>
              <FameTab character={character} floorNumber={state.floor.floorNumber} />
            </div>
            <div className={tab === 'rules' ? 'block' : 'hidden'}>
              <RulesTab />
            </div>
          </div>
          
          {/* Desktop-only Middle Column (Hero Dice Roller & Skills) */}
          <div className="hidden md:flex md:flex-col md:p-8 md:gap-8 md:overflow-y-auto bg-hud-bg">
             {/* Middle column contains the dice roller + skills on desktop */}
             <div className="flex-1 flex flex-col gap-8">
               <DiceHero character={character} floor={state.floor} send={send} />
               
               <Hotlist 
                 character={character} 
                 send={send} 
                 onCharacterUpdate={() => send({ type: 'full_state_sync_request' } as any)} 
               />
               
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
               {state.characters.some(c => c.id !== character.id && activeCharIds.includes(c.id)) && (
                 <div className="p-4 border-b border-hud-border">
                   <PartySidebar characters={state.characters} myCharId={character.id} activeCharIds={activeCharIds} onInspect={setInspectCharId} />
                 </div>
               )}

               <div className="p-4">
                 <FameTab character={character} floorNumber={state.floor.floorNumber} />
               </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Mobile-only Bottom Nav */}
      <div className="md:hidden flex border-t border-hud-border bg-hud-bg py-4 pb-8 fixed bottom-0 left-0 right-0 z-50">
        {TABS.map(t => {
          let icon = "📊"
          if (t.id === 'skills') icon = "⚔️"
          if (t.id === 'fame') icon = "⭐"
          if (t.id === 'rules') icon = "📜"

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
      
      {/* Desktop-only Rules Modal overlay */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-hud-bg/95 flex items-center justify-center z-50 p-4" onClick={() => setShowRulesModal(false)}>
          <div className="bg-hud-panel border border-hud-border w-full max-w-lg flex flex-col overflow-hidden rounded-xl"
            style={{ maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-hud-border flex-shrink-0 bg-hud-panel/40">
              <div className="font-hud text-xs text-hud-accent tracking-widest font-bold uppercase">📜 SYSTEM RULES HANDBOOK</div>
              <button onClick={() => setShowRulesModal(false)} className="text-hud-muted hover:text-hp-low font-hud text-xs font-bold border border-hud-border/40 px-2 py-0.5 hover:border-red-900 rounded">✕ CLOSE</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <RulesTab />
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal overlay */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-hud-bg/95 flex items-center justify-center z-50 p-4" onClick={() => setShowInventoryModal(false)}>
          <div className="bg-hud-panel border border-hud-border w-full max-w-2xl flex flex-col overflow-hidden rounded-xl"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-hud-border flex-shrink-0 bg-hud-panel/40">
              <div className="font-hud text-xs text-hud-accent tracking-widest font-bold uppercase">🎒 CRAWLER INVENTORY</div>
              <button onClick={() => setShowInventoryModal(false)} className="text-hud-muted hover:text-hp-low font-hud text-xs font-bold border border-hud-border/40 px-2 py-0.5 hover:border-red-900 rounded">✕ CLOSE</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <InventoryTab 
                character={character} 
                lootQueue={state.lootQueue} 
                send={send} 
                onCharacterUpdate={() => send({ type: 'full_state_sync_request' } as any)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
