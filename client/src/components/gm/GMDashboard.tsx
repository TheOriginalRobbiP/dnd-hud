import { useState, useCallback } from 'react'
import type { DirectMessage } from '../../hooks/useWebSocket'
import type { AppState, WSMessage } from '../../types'
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

export function GMDashboard({ state, send }: GMDashboardProps) {
  const [mobilePanel, setMobilePanel] = useState<'room' | 'log'>('room')
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([])
  const [sessionMgrOpen, setSessionMgrOpen] = useState(false)
  const [gmMode, setGmMode] = useState<GmMode>('live')
  const handleDMRead = useCallback(() => setDmMessages(prev => prev.map(m => ({ ...m, read: true }))), [])

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
          <SessionLog state={state} />
          <button onClick={() => setSessionMgrOpen(true)}
            className="font-hud text-xs border border-hud-border text-hud-muted px-2 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider">
            ⟳
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

      {/* Character bar */}
      <CharacterBar characters={state.characters} lootQueue={state.lootQueue} send={send} dmMessages={dmMessages} onDMRead={handleDMRead} />

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

        {/* ── RUN mode: FloorRunnerPanel sidebar + RoomPanel ── */}
        {gmMode === 'run' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Runner canvas sidebar */}
            <div className="w-80 flex-shrink-0 border-r border-hud-border overflow-hidden flex flex-col">
              <FloorRunnerPanel send={send} />
            </div>
            {/* Room panel on the right */}
            <div className="flex-1 overflow-hidden">
              <RoomPanel floor={state.floor} send={send} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
