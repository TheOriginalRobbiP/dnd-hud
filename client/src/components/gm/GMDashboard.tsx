import { useState, useCallback, useEffect } from 'react'
import type { DirectMessage } from '../../hooks/useWebSocket'
import type { AppState, WSMessage, Character } from '../../types'
import { CharacterBar } from './CharacterBar'
import { RoomPanel } from './RoomPanel'
import { GMLogPanel } from './GMLogPanel'
import { SessionLog } from './SessionLog'
import { SessionManager } from './SessionManager'
import { FloorPlanner } from './FloorPlanner'
import { FloorRunnerPanel } from './FloorRunnerPanel'
import { SoundboardPanel } from './SoundboardPanel'

interface GMDashboardProps {
  state: AppState
  send: (msg: WSMessage) => void
}

type GmMode = 'plan' | 'session' | 'sound'
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
  onExpand: () => void
}

function CollapsedCharStrip({ characters, onExpand }: CollapsedCharStripProps) {
  const activeChars = characters.filter(c => c.isActive !== false)
  return (
    <div className="border-b border-hud-border bg-hud-panel flex items-center gap-2 px-3 flex-shrink-0 h-10 overflow-x-auto">
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
        {activeChars.length === 0
          ? <span className="font-hud text-xs text-hud-muted italic">No active crawlers</span>
          : activeChars.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-1 border border-hud-border px-2 py-0.5 flex-shrink-0"
                title={`${c.crawlerName} — ${c.hp}/${c.maxHp} HP`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${hpDotClass(c.hp, c.maxHp)}`}
                />
                <span className="font-hud text-[10px] text-hud-text leading-none">{c.crawlerName}</span>
              </div>
            ))
        }
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

export function GMDashboard({ state, send }: GMDashboardProps) {
  const [mobileTab, setMobileTab] = useState<SessionMobileTab>('map')
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([])
  const [sessionMgrOpen, setSessionMgrOpen] = useState(false)
  const [gmMode, setGmMode] = useState<GmMode>('session')
  const [notesSize, setNotesSize] = useState<NotesSize>('md')
  const [charBarCollapsed, setCharBarCollapsed] = useState(false)
  const handleDMRead = useCallback(() => setDmMessages(prev => prev.map(m => ({ ...m, read: true }))), [])

  // Auto-collapse char bar in both modes; restore never (manual toggle only resets on mode change)
  useEffect(() => {
    setCharBarCollapsed(true)
  }, [gmMode])

  const activeCharacters = state.characters.filter(c => c.isActive !== false)
  const sessionActive = state.floor?.sessionActive ?? false

  return (
    <div className="h-screen flex flex-col bg-hud-bg overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {sessionMgrOpen && (
        <SessionManager send={send} onClose={() => setSessionMgrOpen(false)} />
      )}

      {/* Header */}
      <div className="border-b border-hud-border px-3 py-2 flex items-center justify-between bg-hud-panel flex-shrink-0 gap-2">
        <div className="font-hud text-hud-accent tracking-widest text-xs sm:text-sm flex-shrink-0">THE HUD — GM</div>

        {/* PLAN / SESSION mode toggle */}
        <div className="flex gap-1 flex-shrink-0">
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
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* SESSION START / STOP — prominent */}
          <button
            onClick={() => send({ type: sessionActive ? 'session_stop' : 'session_start' })}
            className={`font-hud text-xs border px-3 py-1 tracking-wider transition-colors ${
              sessionActive
                ? 'border-red-700 text-red-400 hover:bg-red-950'
                : 'border-green-700 text-green-400 hover:bg-green-950'
            }`}
          >
            {sessionActive ? '⏹ STOP' : '▶ START'}
          </button>
          {/* Notes size toggle — only in SESSION mode */}
          {gmMode === 'session' && (
            <div className="flex gap-1 flex-shrink-0">
              {(['sm', 'md', 'lg'] as NotesSize[]).map(size => (
                <button
                  key={size}
                  onClick={() => setNotesSize(size)}
                  className={`font-hud text-xs border px-2 py-1 transition-colors ${notesSize === size ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'}`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          <SessionLog state={state} />
          <button onClick={() => setSessionMgrOpen(true)}
            className="font-hud text-xs border border-hud-border text-hud-muted px-2 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider">
            ⟳
          </button>
          {/* Char bar collapse toggle */}
          <button
            onClick={() => setCharBarCollapsed(c => !c)}
            title={charBarCollapsed ? 'Expand character bar' : 'Collapse character bar'}
            className="font-hud text-xs border border-hud-border text-hud-muted px-2 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider"
          >
            {charBarCollapsed ? '▾' : '▴'}
          </button>
          <div className="font-hud text-xs text-hud-muted hidden md:block">
            F{state.floor.floorNumber} · {state.floor.neighbourhoodName.toUpperCase()} · R{state.floor.roomNumber} · {activeCharacters.length} CRAWLERS
          </div>
        </div>

        {/* Mobile tab switcher — only in SESSION mode */}
        {gmMode === 'session' && (
          <div className="flex gap-1 sm:hidden">
            <button onClick={() => setMobileTab('map')}
              className={`font-hud text-xs border px-2 py-1 transition-colors ${mobileTab === 'map' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted'}`}>
              MAP
            </button>
            <button onClick={() => setMobileTab('room')}
              className={`font-hud text-xs border px-2 py-1 transition-colors ${mobileTab === 'room' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted'}`}>
              ROOM
            </button>
            <button onClick={() => setMobileTab('log')}
              className={`font-hud text-xs border px-2 py-1 transition-colors ${mobileTab === 'log' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted'}`}>
              LOG
            </button>
          </div>
        )}
      </div>

      {/* Character bar — full or collapsed strip */}
      {charBarCollapsed
        ? <CollapsedCharStrip
            characters={state.characters}
            onExpand={() => setCharBarCollapsed(false)}
          />
        : <CharacterBar
            characters={state.characters}
            lootQueue={state.lootQueue}
            send={send}
            dmMessages={dmMessages}
            onDMRead={handleDMRead}
          />
      }

      {/* Main area — switches based on gmMode */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── PLAN mode: FloorPlanner full-width ────── */}
        {gmMode === 'plan' && (
          <div className="flex-1 overflow-hidden">
            <FloorPlanner send={send} />
          </div>
        )}

        {/* ── SOUND mode: Soundboard full-width ────── */}
        {gmMode === 'sound' && (
          <div className="flex-1 overflow-y-auto">
            <SoundboardPanel send={send} />
          </div>
        )}

        {/* ── SESSION mode: FloorRunnerPanel 55% + split right column 45% ── */}
        {gmMode === 'session' && (
          <>
            {/* Desktop layout */}
            <div className="hidden sm:flex flex-1 overflow-hidden">
              {/* Left column — map/runner */}
              <div className="flex-[55] min-w-0 overflow-hidden flex flex-col border-r border-hud-border">
                <FloorRunnerPanel send={send} notesTextSize={notesSize} />
              </div>
              {/* Right column — room panel + log panel stacked */}
              <div className="flex-[45] min-w-0 flex flex-col border-l border-hud-border overflow-hidden">
                {/* Top half: RoomPanel */}
                <div className="flex-[55] min-h-0 overflow-hidden border-b border-hud-border">
                  <RoomPanel floor={state.floor} send={send} />
                </div>
                {/* Bottom half: GMLogPanel */}
                <div className="flex-[45] min-h-0 overflow-hidden flex flex-col">
                  <GMLogPanel gmLog={state.gmLog} lootQueue={state.lootQueue} characters={activeCharacters} send={send} />
                </div>
              </div>
            </div>

            {/* Mobile layout — single panel at a time */}
            <div className="flex sm:hidden flex-1 overflow-hidden">
              {mobileTab === 'map' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <FloorRunnerPanel send={send} notesTextSize={notesSize} />
                </div>
              )}
              {mobileTab === 'room' && (
                <div className="flex-1 overflow-hidden">
                  <RoomPanel floor={state.floor} send={send} />
                </div>
              )}
              {mobileTab === 'log' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <GMLogPanel gmLog={state.gmLog} lootQueue={state.lootQueue} characters={activeCharacters} send={send} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
