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

interface GMDashboardProps {
  state: AppState
  send: (msg: WSMessage) => void
}

type GmMode = 'live' | 'plan' | 'run'
type NotesSize = 'sm' | 'md' | 'lg'

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
  const [mobilePanel, setMobilePanel] = useState<'room' | 'log'>('room')
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([])
  const [sessionMgrOpen, setSessionMgrOpen] = useState(false)
  const [gmMode, setGmMode] = useState<GmMode>('live')
  const [notesSize, setNotesSize] = useState<NotesSize>('md')
  const [charBarCollapsed, setCharBarCollapsed] = useState(false)
  const handleDMRead = useCallback(() => setDmMessages(prev => prev.map(m => ({ ...m, read: true }))), [])

  // Auto-collapse char bar when entering plan/run mode; restore on live
  useEffect(() => {
    if (gmMode === 'plan' || gmMode === 'run') {
      setCharBarCollapsed(true)
    } else {
      setCharBarCollapsed(false)
    }
  }, [gmMode])

  const activeCharacters = state.characters.filter(c => c.isActive !== false)

  return (
    <div className="h-screen flex flex-col bg-hud-bg overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {sessionMgrOpen && (
        <SessionManager send={send} onClose={() => setSessionMgrOpen(false)} />
      )}

      {/* Header */}
      <div className="border-b border-hud-border px-3 py-2 flex items-center justify-between bg-hud-panel flex-shrink-0 gap-2">
        <div className="font-hud text-hud-accent tracking-widest text-xs sm:text-sm flex-shrink-0">THE HUD — GM</div>

        {/* PLAN / RUN mode toggle */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setGmMode('live')}
            className={`font-hud text-xs border px-2 py-1 transition-colors ${gmMode === 'live' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'}`}
          >
            LIVE
          </button>
          <button
            onClick={() => setGmMode('plan')}
            className={`font-hud text-xs border px-2 py-1 transition-colors ${gmMode === 'plan' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'}`}
          >
            PLAN
          </button>
          <button
            onClick={() => setGmMode('run')}
            className={`font-hud text-xs border px-2 py-1 transition-colors ${gmMode === 'run' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'}`}
          >
            RUN
          </button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notes size toggle — only in RUN mode */}
          {gmMode === 'run' && (
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

        {/* Mobile panel switcher — only relevant in live mode */}
        {gmMode === 'live' && (
          <div className="flex gap-1 sm:hidden">
            <button onClick={() => setMobilePanel('room')}
              className={`font-hud text-xs border px-2 py-1 transition-colors ${mobilePanel === 'room' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted'}`}>
              ROOM
            </button>
            <button onClick={() => setMobilePanel('log')}
              className={`font-hud text-xs border px-2 py-1 transition-colors ${mobilePanel === 'log' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted'}`}>
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

        {/* ── LIVE mode: existing Room + Log panels ─── */}
        {gmMode === 'live' && (
          <>
            {/* Desktop: both panels visible */}
            <div className="hidden sm:flex flex-1 overflow-hidden">
              <RoomPanel floor={state.floor} send={send} />
              <GMLogPanel gmLog={state.gmLog} lootQueue={state.lootQueue} characters={activeCharacters} send={send} />
            </div>
            {/* Mobile: one panel at a time */}
            <div className="flex sm:hidden flex-1 overflow-hidden">
              {mobilePanel === 'room'
                ? <RoomPanel floor={state.floor} send={send} />
                : <GMLogPanel gmLog={state.gmLog} lootQueue={state.lootQueue} characters={activeCharacters} send={send} />
              }
            </div>
          </>
        )}

        {/* ── PLAN mode: FloorPlanner full-width ────── */}
        {gmMode === 'plan' && (
          <div className="flex-1 overflow-hidden">
            <FloorPlanner send={send} />
          </div>
        )}

        {/* ── RUN mode: FloorRunnerPanel 55% + RoomPanel 45% ── */}
        {gmMode === 'run' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Runner canvas — 55% */}
            <div className="flex-[55] min-w-0 overflow-hidden flex flex-col border-r border-hud-border">
              <FloorRunnerPanel send={send} notesTextSize={notesSize} />
            </div>
            {/* Room panel — 45% */}
            <div className="flex-[45] min-w-0 overflow-hidden">
              <RoomPanel floor={state.floor} send={send} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
