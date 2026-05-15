import { useState, useCallback } from 'react'
import type { DirectMessage } from '../../hooks/useWebSocket'
import type { AppState, WSMessage } from '../../types'
import { CharacterBar } from './CharacterBar'
import { RoomPanel } from './RoomPanel'
import { GMLogPanel } from './GMLogPanel'
import { SessionLog } from './SessionLog'
import { SessionManager } from './SessionManager'

interface GMDashboardProps {
  state: AppState
  send: (msg: WSMessage) => void
}

export function GMDashboard({ state, send }: GMDashboardProps) {
  const [mobilePanel, setMobilePanel] = useState<'room' | 'log'>('room')
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([])
  const [sessionMgrOpen, setSessionMgrOpen] = useState(false)
  const handleDMRead = useCallback(() => setDmMessages(prev => prev.map(m => ({ ...m, read: true }))), [])

  const activeCharacters = state.characters.filter(c => c.isActive !== false)

  return (
    <div className="h-screen flex flex-col bg-hud-bg overflow-hidden">

      {sessionMgrOpen && (
        <SessionManager send={send} onClose={() => setSessionMgrOpen(false)} />
      )}

      {/* Header */}
      <div className="border-b border-hud-border px-4 py-2 flex items-center justify-between bg-hud-panel flex-shrink-0">
        <div className="font-hud text-hud-accent tracking-widest text-sm">THE HUD — GM CONSOLE</div>
        <div className="flex items-center gap-3">
          <SessionLog state={state} />
          <button onClick={() => setSessionMgrOpen(true)}
            className="font-hud text-xs border border-hud-border text-hud-muted px-2 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wider">
            ⟳ SESSION
          </button>
        <div className="font-hud text-xs text-hud-muted hidden sm:block">
          FLOOR {state.floor.floorNumber} · {state.floor.neighbourhoodName.toUpperCase()} · ROOM {state.floor.roomNumber} · {activeCharacters.length} CRAWLERS
        </div></div>
        {/* Mobile panel switcher */}
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
      </div>

      {/* Character bar */}
      <CharacterBar characters={state.characters} lootQueue={state.lootQueue} send={send} dmMessages={dmMessages} onDMRead={handleDMRead} />

      {/* Main panels — side by side on desktop, tabbed on mobile */}
      <div className="flex flex-1 overflow-hidden">
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
      </div>
    </div>
  )
}
