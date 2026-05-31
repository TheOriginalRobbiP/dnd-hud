import { useState, useEffect, useRef } from 'react'
import type { Character, AppState, WSMessage } from '../../types'
import { DMPanel } from '../shared/DMPanel'
import { InspectModal } from '../shared/InspectModal'
import type { DirectMessage } from '../../hooks/useWebSocket'
import { StatusTab } from './StatusTab'
import { SkillsTab } from './SkillsTab'
import { InventoryTab } from './InventoryTab'
import { FameTab } from './FameTab'
import { DiceHero } from './DiceHero'
import { PartySidebar } from './PartySidebar'
import { RulesTab } from './RulesTab'
import { Hotlist } from './Hotlist'
import { getModifiedCharacter } from '../../utils/modifiers'
import { Battlemap } from '../shared/Battlemap'
import { JournalEditor } from './JournalEditor'

type Tab = 'status' | 'skills' | 'map' | 'notes' | 'fame' | 'rules'
const TABS: { id: Tab; label: string }[] = [
  { id: 'status', label: 'STATUS' },
  { id: 'skills', label: 'SKILLS' },
  { id: 'map', label: 'MAP' },
  { id: 'notes', label: 'NOTES' },
  { id: 'fame', label: 'FAME' },
  { id: 'rules', label: 'RULES' },
]

interface ActionLogEntry {
  id: string
  timestamp: number
  text: string
  type: 'roll' | 'item' | 'equip' | 'status' | 'system'
}

interface PlayerHUDProps {
  character: Character
  state: AppState
  send: (msg: WSMessage) => void
  dmMessages: DirectMessage[]
  onDMRead: () => void
  onDMEcho: (dm: DirectMessage) => void
  activeCharIds: string[]
  onCharacterUpdate?: () => void
}

export function PlayerHUD({ character: rawCharacter, state, send, dmMessages, onDMRead, onDMEcho, activeCharIds }: PlayerHUDProps) {
  const [tab, setTab] = useState<Tab>('status')
  const [selectedAction, setSelectedAction] = useState<any>(null)
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [showJournalModal, setShowJournalModal] = useState(false)
  const [inspectCharId, setInspectCharId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([])
  
  const lastProcessedLog = useRef<string | null>(null)
  const character = getModifiedCharacter(rawCharacter)

  // 1. Persist action log to local storage keyed on character ID
  useEffect(() => {
    const key = `hud:log:${character.id}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        setActionLog(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    } else {
      setActionLog([])
    }
  }, [character.id])

  const addLogEntry = (text: string, type: ActionLogEntry['type']) => {
    setActionLog(prev => {
      const updated = [
        { id: Math.random().toString(36).substring(2), timestamp: Date.now(), text, type },
        ...prev
      ].slice(0, 50)
      localStorage.setItem(`hud:log:${character.id}`, JSON.stringify(updated))
      return updated
    })
  }

  const handleOpenInventory = () => {
    if (state.floor.preTutorialActive) {
      addLogEntry("⚠️ [BORANT SECURITY] ENCRYPTED MODULE: Register at nearest Tutorial Guild to decrypt inventory storage.", "system")
      // Optionally trigger a subtle error beep if sound is wired
      send({ type: 'play_sound', soundId: 'error' })
    } else {
      setShowInventoryModal(true)
    }
  }

  // 2. Setup screen resizing detect
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 3. Process incoming global logs and intercept character-specific statements for the Crawler Log
  useEffect(() => {
    if (state.gmLog.length > 0) {
      const latestLog = state.gmLog[0]

      // Initial anchor point
      if (lastProcessedLog.current === null) {
        lastProcessedLog.current = latestLog

        // Populate initial action log from the GM log by filtering for this character's name
        const initialLogs = state.gmLog
          .filter(entry => entry.toLowerCase().includes(character.crawlerName.toLowerCase()))
          .map(entry => ({
            id: Math.random().toString(36).substring(2),
            timestamp: Date.now(),
            text: entry,
            type: (entry.includes('rolled') ? 'roll' : entry.includes('Loot') ? 'item' : 'system') as ActionLogEntry['type']
          }))
        if (initialLogs.length > 0) {
          setActionLog(prev => {
            if (prev.length > 0) return prev // keep existing saved cache if loaded
            const updated = initialLogs.reverse().slice(0, 50)
            localStorage.setItem(`hud:log:${character.id}`, JSON.stringify(updated))
            return updated
          })
        }
        return
      }

      // Check if a new log has arrived (independent of array length constraints)
      if (latestLog !== lastProcessedLog.current) {
        const lastIdx = state.gmLog.indexOf(lastProcessedLog.current)
        const newEntries = lastIdx === -1 ? state.gmLog : state.gmLog.slice(0, lastIdx)

        // Process new entries chronologically (oldest to newest)
        newEntries.reverse().forEach(entry => {
          if (entry.toLowerCase().includes(character.crawlerName.toLowerCase())) {
            const crawlerLogType = entry.includes('rolled') ? 'roll'
              : entry.includes('Achievement') ? 'system'
              : entry.includes('Loot') ? 'item'
              : 'system' as ActionLogEntry['type']
            addLogEntry(entry, crawlerLogType)
          }
        })

        lastProcessedLog.current = latestLog
      }
    }
  }, [state.gmLog, character.crawlerName, character.id])

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
              LVL {(character as any).level || 1} {(character as any).class || 'CRAWLER'}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 text-[11px]">
          <div className="flex gap-2 items-center">
            <button 
              onClick={handleOpenInventory}
              className={`font-hud text-[10px] border px-2 py-0.5 transition-colors tracking-wider flex items-center gap-1 rounded ${
                state.floor.preTutorialActive 
                  ? 'border-red-900/60 text-red-500 bg-red-950/5' 
                  : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent bg-hud-bg/50'
              }`}
            >
              <span>{state.floor.preTutorialActive ? '🔒' : '🎒'}</span>
              <span>{state.floor.preTutorialActive ? 'LOCKED' : 'INVENTORY'}</span>
            </button>
            <DMPanel mode="player" myCharId={character.id} myName={character.crawlerName} messages={dmMessages} send={send} onRead={onDMRead} onEcho={onDMEcho} />
          </div>
          <div className="font-bold tracking-widest text-hud-success">HP {character.hp}/{character.maxHp}</div>
        </div>
      </div>

      {/* Desktop-only Header */}
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
          <div className="font-hud text-sm text-hud-accent tracking-widest flex items-center gap-2">
            <span>{character.isAlive ? character.crawlerName.toUpperCase() : `☠ ${character.crawlerName.toUpperCase()}`}</span>
            <span className="opacity-40 text-xs">|</span>
            <span className="text-hud-muted text-xs font-bold uppercase">LVL {(character as any).level || 1} {(character as any).class || 'CRAWLER'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 pr-2">
          <button 
            onClick={handleOpenInventory}
            className={`font-hud text-[10px] sm:text-xs border px-2.5 py-1 transition-colors tracking-wider flex items-center gap-1.5 ${
              state.floor.preTutorialActive 
                ? 'border-red-900/60 text-red-500 bg-red-950/5' 
                : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'
            }`}
          >
            <span>{state.floor.preTutorialActive ? '🔒' : '🎒'}</span>
            <span>{state.floor.preTutorialActive ? 'LOCKED' : 'INVENTORY'}</span>
          </button>
          <button 
            onClick={() => setShowJournalModal(true)}
            className="font-hud text-[10px] sm:text-xs border border-hud-border text-hud-muted px-2.5 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider flex items-center gap-1.5"
          >
            <span>🗒️</span>
            <span>JOURNAL</span>
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
                actionLog={actionLog}
              />
            </div>
            <div className={tab === 'skills' ? 'block md:hidden' : 'hidden'}>
              <SkillsTab character={character} onSelectAction={setSelectedAction} selectedActionId={selectedAction?.id} />
            </div>
            <div className={tab === 'fame' ? 'block' : 'hidden md:hidden'}>
              <FameTab character={character} floorNumber={state.floor.floorNumber} locked={state.floor.preTutorialActive} />
            </div>
            <div className={tab === 'map' ? 'block md:hidden h-[calc(100vh-180px)] p-2' : 'hidden'}>
              {state.floor.displayViewMode === 'scene' && (state.floor.currentRoomData?.sceneArt || state.floor.currentRoomData?.flavourArt) ? (
                <div className="relative w-full h-full bg-[#0a0a0c] border border-hud-border rounded-lg overflow-hidden flex flex-col justify-end">
                  <img
                    src={state.floor.currentRoomData.sceneArt || state.floor.currentRoomData.flavourArt}
                    alt="Scene"
                    className="absolute inset-0 w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                  <div className="relative z-10 p-5 flex flex-col gap-1">
                    <span className="font-hud text-[8px] text-[#f59e0b] tracking-[0.25em] uppercase font-bold">NARRATIVE VIEW ACTIVE</span>
                    <span className="font-hud text-sm text-hud-text font-extrabold uppercase">{state.floor.currentRoomData.roomName}</span>
                    <span className="font-hud text-[10px] text-hud-muted mt-1 leading-relaxed max-w-[280px]">
                      The dungeon is currently in narrative mode. The GM will cross-fade to the tactical combat map when positioning matters!
                    </span>
                  </div>
                </div>
              ) : (
                <Battlemap
                  mapUrl={state.floor.currentRoomData?.battlemapArt || state.floor.currentRoomData?.flavourArt || null}
                  characters={state.characters}
                  activeMobs={state.floor.activeMobs}
                  isEditable={false}
                  myCharacterId={character.id}
                  activeCharIds={activeCharIds}
                  onTokenMove={(id, isMob, posX, posY) => {
                    if (!isMob) {
                      send({ type: 'token_move', charId: id, posX, posY })
                    } else {
                      send({ type: 'token_move', mobId: id, posX, posY })
                    }
                  }}
                />
              )}
            </div>
            <div className={tab === 'rules' ? 'block md:hidden' : 'hidden'}>
              <RulesTab />
            </div>
            <div className={tab === 'notes' ? 'block md:hidden h-full p-2' : 'hidden'}>
              <JournalEditor
                characterId={character.id}
                crawlerName={character.crawlerName}
                initialNotes={character.playerNotes || ''}
                send={send}
              />
            </div>
          </div>
          
          {/* Desktop Middle Column - Dynamically swaps based on tab selection! */}
          <div className="hidden md:flex md:flex-col md:p-6 md:gap-5 md:overflow-hidden bg-hud-bg">
            
            {/* Desktop Tab Bar */}
            <div className="flex gap-1 bg-hud-panel border border-hud-border/30 p-0.5 rounded flex-shrink-0 select-none">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 font-hud text-[10px] py-1.5 rounded transition-all font-bold tracking-widest uppercase text-center ${
                    tab === t.id
                      ? 'bg-hud-accent text-hud-bg font-extrabold shadow-sm'
                      : 'text-hud-muted hover:text-hud-text hover:bg-hud-panel/40'
                  }`}
                >
                  {t.id === 'status' ? '🎲 ROLLER' : t.label}
                </button>
              ))}
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {tab === 'status' && (
                <div className="flex flex-col gap-6">
                  <DiceHero 
                    character={character} 
                    floor={state.floor} 
                    send={send} 
                    selectedAction={selectedAction} 
                    onClearSelection={() => setSelectedAction(null)} 
                  />
                  
                  <Hotlist 
                    character={character} 
                    send={send} 
                    onCharacterUpdate={() => send({ type: 'full_state_sync_request' } as any)} 
                    locked={state.floor.preTutorialActive}
                  />
                  
                  <div className="bg-hud-panel border border-hud-border rounded-xl p-6">
                    <div className="font-mono text-xs text-hud-muted tracking-[0.2em] mb-4 uppercase border-b border-hud-border pb-2">Skills & Abilities</div>
                    <SkillsTab character={character} onSelectAction={setSelectedAction} selectedActionId={selectedAction?.id} />
                  </div>
                </div>
              )}

              {tab === 'map' && (
                <div className="h-full flex flex-col min-h-[400px]">
                  {state.floor.displayViewMode === 'scene' && (state.floor.currentRoomData?.sceneArt || state.floor.currentRoomData?.flavourArt) ? (
                    <div className="relative w-full h-full min-h-[350px] bg-[#0a0a0c] border border-hud-border rounded-lg overflow-hidden flex flex-col justify-end">
                      <img
                        src={state.floor.currentRoomData.sceneArt || state.floor.currentRoomData.flavourArt}
                        alt="Scene"
                        className="absolute inset-0 w-full h-full object-cover opacity-85"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                      <div className="relative z-10 p-5 flex flex-col gap-1">
                        <span className="font-hud text-[8px] text-[#f59e0b] tracking-[0.25em] uppercase font-bold">NARRATIVE VIEW ACTIVE</span>
                        <span className="font-hud text-sm text-hud-text font-extrabold uppercase">{state.floor.currentRoomData.roomName}</span>
                        <span className="font-hud text-[10px] text-hud-muted mt-1 leading-relaxed max-w-[280px]">
                          The dungeon is currently in narrative mode. The GM will cross-fade to the tactical combat map when positioning matters!
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Battlemap
                      mapUrl={state.floor.currentRoomData?.battlemapArt || state.floor.currentRoomData?.flavourArt || null}
                      characters={state.characters}
                      activeMobs={state.floor.activeMobs}
                      isEditable={false}
                      myCharacterId={character.id}
                      activeCharIds={activeCharIds}
                      onTokenMove={(id, isMob, posX, posY) => {
                        if (!isMob) {
                          send({ type: 'token_move', charId: id, posX, posY })
                        } else {
                          send({ type: 'token_move', mobId: id, posX, posY })
                        }
                      }}
                    />
                  )}
                </div>
              )}

              {tab === 'skills' && (
                <div className="bg-hud-panel border border-hud-border rounded-xl p-4">
                  <SkillsTab character={character} onSelectAction={setSelectedAction} selectedActionId={selectedAction?.id} />
                </div>
              )}

              {tab === 'notes' && (
                <div className="h-full flex flex-col bg-hud-panel border border-hud-border rounded-xl p-4 min-h-[400px]">
                  <JournalEditor
                    characterId={character.id}
                    crawlerName={character.crawlerName}
                    initialNotes={character.playerNotes || ''}
                    send={send}
                  />
                </div>
              )}

              {tab === 'rules' && (
                <div className="bg-hud-panel border border-hud-border rounded-xl p-4">
                  <RulesTab />
                </div>
              )}

              {tab === 'fame' && (
                <div className="bg-hud-panel border border-hud-border rounded-xl p-4">
                  <FameTab character={character} floorNumber={state.floor.floorNumber} locked={state.floor.preTutorialActive} />
                </div>
              )}
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

               {/* Equipment & Lootboxes shown on the main HUD for desktop */}
               <div className="p-4 border-b border-hud-border">
                 <InventoryTab 
                   character={character} 
                   lootQueue={state.lootQueue} 
                   send={send} 
                   onCharacterUpdate={() => send({ type: 'full_state_sync_request' } as any)} 
                   hideSections={['backpack']}
                   compact={true}
                   onLogAction={addLogEntry}
                   locked={state.floor.preTutorialActive}
                   floorState={state.floor}
                   onSelectAction={setSelectedAction}
                   selectedActionId={selectedAction?.id}
                 />
               </div>

               <div className="p-4">
                 <FameTab character={character} floorNumber={state.floor.floorNumber} locked={state.floor.preTutorialActive} />
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
          if (t.id === 'map') icon = "🗺️"
          if (t.id === 'notes') icon = "🗒️"
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

      {inspectChar && <InspectModal character={inspectChar} onClose={() => setInspectCharId(null)} hideNotes />}
      
      {/* Desktop-only Journal Modal overlay */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-hud-bg/95 flex items-center justify-center z-50 p-4" onClick={() => setShowJournalModal(false)}>
          <div className="bg-hud-panel border border-hud-border w-full max-w-2xl flex flex-col overflow-hidden rounded-xl"
            style={{ height: '80vh', maxHeight: '700px' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-hud-border flex-shrink-0 bg-hud-panel/40">
              <div className="font-hud text-xs text-hud-accent tracking-widest font-bold uppercase">🗒️ CRAWLER JOURNAL</div>
              <button onClick={() => setShowJournalModal(false)} className="text-hud-muted hover:text-hp-low font-hud text-xs font-bold border border-hud-border/40 px-2 py-0.5 hover:border-red-900 rounded">✕ CLOSE</button>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <JournalEditor
                characterId={character.id}
                crawlerName={character.crawlerName}
                initialNotes={character.playerNotes || ''}
                send={send}
              />
            </div>
          </div>
        </div>
      )}

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
              <div className="font-hud text-xs text-hud-accent tracking-widest font-bold uppercase">🎒 {isMobile ? 'CRAWLER INVENTORY' : '🎒 INVENTORY'}</div>
              <button onClick={() => setShowInventoryModal(false)} className="text-hud-muted hover:text-hp-low font-hud text-xs font-bold border border-hud-border/40 px-2 py-0.5 hover:border-red-900 rounded">✕ CLOSE</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <InventoryTab 
                character={character} 
                lootQueue={state.lootQueue} 
                send={send} 
                onCharacterUpdate={() => send({ type: 'full_state_sync_request' } as any)} 
                hideSections={isMobile ? [] : ['loot', 'equipment']}
                onLogAction={addLogEntry}
                locked={state.floor.preTutorialActive}
                floorState={state.floor}
                onSelectAction={setSelectedAction}
                selectedActionId={selectedAction?.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}