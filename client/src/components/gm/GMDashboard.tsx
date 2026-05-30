import { useState, useEffect } from 'react'
import type { AppState, WSMessage, Character } from '../../types'
import { RoomPanel } from './RoomPanel'
import { GMLogPanel } from './GMLogPanel'
import { SessionManager } from './SessionManager'
import { FloorPlanner } from './FloorPlanner'
import { SessionNavigator } from './SessionNavigator'
import { GMRulesPanel } from './GMRulesPanel'
import { SoundboardPanel } from './SoundboardPanel'
import { CharacterBar } from './CharacterBar'
import { ItemDatabasePanel } from './ItemDatabasePanel'
import type { DirectMessage } from '../../hooks/useWebSocket'

interface GMDashboardProps {
  state: AppState
  send: (msg: WSMessage) => void
  activeCharIds: string[]
  dmMessages: DirectMessage[]
  onDMRead: () => void
  onDMEcho: (dm: DirectMessage) => void
}

type GmMode = 'plan' | 'session' | 'sound' | 'rules' | 'items'
type NotesSize = 'sm' | 'md' | 'lg'
type SessionMobileTab = 'map' | 'room' | 'log'

// ── HP dot colour helper ───────────────────────────────────────
function hpDotClass(hp: number, maxHp: number): string {
  if (maxHp <= 0) return 'bg-hud-muted'
  const pct = hp / maxHp
  if (pct > 0.6) return 'bg-green-500'
  if (pct > 0.3) return 'bg-amber-400'
  return 'bg-red-500'
}

// ── Collapsed character strip ──────────────────────────────────
interface CollapsedCharStripProps {
  characters: Character[]
  activeCharIds: string[]
  onExpand: () => void
}

function CollapsedCharStrip({ characters, activeCharIds, onExpand }: CollapsedCharStripProps) {
  const activeChars = characters.filter(c => c.isActive !== false)
  return (
    <div className="border-b border-hud-border bg-hud-panel flex items-center gap-2 px-3 flex-shrink-0 h-10 overflow-x-auto">
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
        {activeChars.length === 0
          ? <span className="font-hud text-xs text-hud-muted italic">No active crawlers</span>
          : activeChars.map(c => {
              const isOnline = activeCharIds.includes(c.id)
              return (
              <div
                key={c.id}
                className={`flex items-center gap-1 border px-2 py-0.5 flex-shrink-0 ${isOnline ? 'border-hud-border' : 'border-red-900/50 opacity-60'}`}
                title={`${c.crawlerName} — ${c.hp}/${c.maxHp} HP${isOnline ? '' : ' (OFFLINE)'}`}
              >
                {isOnline ? (
                  <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${hpDotClass(c.hp, c.maxHp)}`} />
                ) : (
                  <span className="font-hud text-[8px] text-red-500 font-bold leading-none tracking-widest">[OFFLINE]</span>
                )}
                <span className="font-hud text-[10px] text-hud-text leading-none">{c.crawlerName}</span>
              </div>
            )})}
      </div>
      <button
        onClick={onExpand}
        className="font-hud text-[10px] border border-hud-border text-hud-muted px-2 py-0.5 hover:border-hud-accent hover:text-hud-accent transition-colors flex-shrink-0 tracking-wider"
      >
        EXPAND ▾
      </button>
    </div>
  )
}

// ── Main GMDashboard ───────────────────────────────────────────

export function GMDashboard({
  state,
  send,
  activeCharIds,
  dmMessages,
  onDMRead,
  onDMEcho
}: GMDashboardProps) {
  const [mobileTab, setMobileTab] = useState<SessionMobileTab>('map')
  const [sessionMgrOpen, setSessionMgrOpen] = useState(false)
  const [gmMode, setGmMode] = useState<GmMode>('session')
  const [notesSize] = useState<NotesSize>('md')
  const [charBarExpanded, setCharBarExpanded] = useState(true)
  
  const sessionActive = state.floor?.sessionActive ?? false

  const [seenCharIds, setSeenCharIds] = useState<string[]>([])

  // Accumulate seen characters during active sessions.
  // When session is stopped, only show currently connected characters.
  useEffect(() => {
    if (!sessionActive) {
      setSeenCharIds(activeCharIds)
    } else {
      setSeenCharIds(prev => {
        const newIds = activeCharIds.filter(id => !prev.includes(id))
        if (newIds.length > 0) return [...prev, ...newIds]
        return prev
      })
    }
  }, [activeCharIds, sessionActive])

  // activeCharacters contains anyone currently online OR anyone seen during this active session
  const activeCharacters = state.characters.filter(c => c.isActive !== false && seenCharIds.includes(c.id))

  return (
    <div className="min-h-screen flex flex-col bg-hud-bg overflow-y-auto font-sans" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {sessionMgrOpen && (
        <SessionManager floorState={state.floor} send={send} onClose={() => setSessionMgrOpen(false)} />
      )}

      {/* Header */}
      <div className="border-b border-hud-border px-4 py-4 flex items-center justify-between bg-hud-panel flex-shrink-0 gap-2">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => {
              localStorage.removeItem('hud:role')
              sessionStorage.removeItem('hud:gm-verified')
              window.location.reload()
            }}
            title="Switch Role / Logout"
            className="w-8 h-8 flex items-center justify-center border border-hud-border rounded text-hud-muted hover:border-red-500 hover:text-red-500 transition-colors"
          >
            ⏏
          </button>
          <div>
            <div className="text-[22px] font-extrabold leading-none tracking-tight text-hud-text">
              THE HUD
            </div>
            <div className="text-hud-accent text-[11px] font-bold mt-1 tracking-widest uppercase">
              GAME MASTER
            </div>
          </div>
        </div>

        {/* PLAN / SESSION mode toggle (Hidden on mobile entirely) */}
        <div className="hidden md:flex gap-1 flex-shrink-0">
          <button
            onClick={() => setGmMode('plan')}
            className={`font-hud text-xs border px-2 py-1 transition-colors ${gmMode === 'plan' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'}`}
          >
            PLAN
          </button>
          <button
            onClick={() => setGmMode('session')}
            className={`font-hud text-xs border px-2 py-1 transition-colors ${gmMode === 'session' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'}`}
          >
            SESSION
          </button>
          <button
            onClick={() => setGmMode('sound')}
            className={`font-hud text-xs border px-2 py-1 transition-colors ${gmMode === 'sound' ? 'border-purple-400 text-purple-400' : 'border-hud-border text-hud-muted hover:border-purple-400 hover:text-purple-400'}`}
          >
            🔊 SOUND
          </button>
          <button
            onClick={() => setGmMode('rules')}
            className={`font-hud text-xs border px-2 py-1 transition-colors ${gmMode === 'rules' ? 'border-blue-400 text-blue-400' : 'border-hud-border text-hud-muted hover:border-blue-400 hover:text-blue-400'}`}
          >
            📖 RULES
          </button>
          <button
            onClick={() => setGmMode('items')}
            className={`font-hud text-xs border px-2 py-1 transition-colors ${gmMode === 'items' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'}`}
          >
            📦 ITEMS
          </button>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSessionMgrOpen(true)}
            title="Session Manager (Reset, Save/Load Snapshots)"
            className="w-8 h-8 flex items-center justify-center border border-hud-border rounded text-hud-muted hover:border-hud-accent hover:text-hud-accent transition-colors"
          >
            ⚙️
          </button>
          <div className="flex flex-col items-end gap-1">
            <div className="font-bold tracking-widest text-[11px] text-hud-muted">SESSION</div>
            {sessionActive ? (
              <button onClick={() => send({ type: 'session_stop' })} className="font-bold tracking-widest text-[11px] text-hud-success uppercase">ACTIVE</button>
            ) : (
              <button onClick={() => send({ type: 'session_start' })} className="font-bold tracking-widest text-[11px] text-red-500 uppercase">STOPPED</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {gmMode === 'plan' && (
          <div className="flex-1 overflow-hidden flex flex-col pb-12 md:pb-0">
            <FloorPlanner send={send} />
          </div>
        )}

        {gmMode === 'sound' && (
          <div className="flex-1 overflow-hidden flex flex-col pb-12 md:pb-0">
            <SoundboardPanel send={send} />
          </div>
        )}

        {gmMode === 'rules' && (
          <div className="flex-1 overflow-hidden flex flex-col pb-12 md:pb-0">
            <GMRulesPanel send={send} />
          </div>
        )}

        {gmMode === 'items' && (
          <div className="flex-1 overflow-hidden flex flex-col pb-12 md:pb-0">
            <ItemDatabasePanel />
          </div>
        )}

        {gmMode === 'session' && (
          <>
            {/* Desktop Layout — 3 columns */}
            <div className="hidden md:flex flex-1 flex-col">
              <div className="flex-shrink-0 border-b border-hud-border">
                {charBarExpanded ? (
                  <CharacterBar
                    characters={state.characters}
                    lootQueue={state.lootQueue}
                    send={send}
                    dmMessages={dmMessages}
                    onDMRead={onDMRead}
                    onDMEcho={onDMEcho}
                    activeCharIds={activeCharIds}
                    onCollapse={() => setCharBarExpanded(false)}
                  />
                ) : (
                  <CollapsedCharStrip
                    characters={activeCharacters}
                    activeCharIds={activeCharIds}
                    onExpand={() => setCharBarExpanded(true)}
                  />
                )}
              </div>
              <div className="flex-1 min-h-[550px] grid grid-cols-[300px_1fr_400px]">
                <div className="border-r border-hud-border flex flex-col overflow-hidden">
                  <GMLogPanel gmLog={state.gmLog} lootQueue={state.lootQueue} characters={activeCharacters} send={send} />
                </div>
                <div className="flex flex-col overflow-hidden bg-hud-bg">
                  <SessionNavigator
                    send={send}
                    notesTextSize={notesSize}
                    characters={state.characters}
                    activeMobs={state.floor.activeMobs}
                    activeCharIds={activeCharIds}
                  />
                </div>
                <div className="border-l border-hud-border flex flex-col overflow-y-auto">
                  <RoomPanel floor={state.floor} send={send} />
                </div>
              </div>
            </div>

            {/* Mobile layout — single panel at a time */}
            <div className="flex md:hidden flex-1 flex-col pb-24">
              <div className="flex-shrink-0">
                {charBarExpanded ? (
                  <CharacterBar
                    characters={state.characters}
                    lootQueue={state.lootQueue}
                    send={send}
                    dmMessages={dmMessages}
                    onDMRead={onDMRead}
                    onDMEcho={onDMEcho}
                    activeCharIds={activeCharIds}
                    onCollapse={() => setCharBarExpanded(false)}
                  />
                ) : (
                  <CollapsedCharStrip
                    characters={activeCharacters}
                    activeCharIds={activeCharIds}
                    onExpand={() => setCharBarExpanded(true)}
                  />
                )}
              </div>
              <div className="flex-1 flex flex-col gap-4 mt-2">
                {mobileTab === 'map' && (
                  <div className="flex-1 min-h-[400px] flex flex-col">
                    <SessionNavigator
                      send={send}
                      notesTextSize={notesSize}
                      characters={state.characters}
                      activeMobs={state.floor.activeMobs}
                      activeCharIds={activeCharIds}
                    />
                  </div>
                )}
                {mobileTab === 'room' && (
                  <div className="flex-1">
                    <RoomPanel floor={state.floor} send={send} />
                  </div>
                )}
                {mobileTab === 'log' && (
                  <div className="flex-1 min-h-[400px] flex flex-col">
                    <GMLogPanel gmLog={state.gmLog} lootQueue={state.lootQueue} characters={activeCharacters} send={send} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile-only Nav */}
      <div className="md:hidden flex border-t border-hud-border bg-hud-bg py-4 pb-8 fixed bottom-0 left-0 right-0 z-50">
        {(['map', 'room', 'log', 'plan', 'sound'] as const).map(tab => {
          let icon = "🗺️"
          if (tab === 'room') icon = "⚔️"
          if (tab === 'log') icon = "📜"
          if (tab === 'plan') icon = "⚙️"
          if (tab === 'sound') icon = "🔊"

          return (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'plan' || tab === 'sound') {
                  setGmMode(tab as any)
                } else {
                  setGmMode('session')
                  setMobileTab(tab as any)
                }
              }}
              className={`flex-1 flex flex-col items-center gap-1.5 transition-colors ${
                (gmMode === 'session' && mobileTab === tab) || (gmMode !== 'session' && gmMode === tab) ? 'text-hud-accent' : 'text-hud-muted hover:text-hud-text'
              }`}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-bold tracking-widest">{tab.toUpperCase()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
