import { useState, useCallback } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { RoleSelector } from './components/shared/RoleSelector'
import { GMDashboard } from './components/gm/GMDashboard'
import { GMPinGate, isGMVerified, clearGMVerified } from './components/gm/GMPinGate'
import { PlayerHUD } from './components/player/PlayerHUD'
import { ToastFeed } from './components/shared/ToastFeed'
import type { UserRole } from './types'
import type { DirectMessage } from './hooks/useWebSocket'
import type { Toast } from './components/shared/ToastFeed'

const ROLE_KEY = 'hud:role'

function App() {
  const [role, setRole] = useState<UserRole | null>(() => {
    return (localStorage.getItem(ROLE_KEY) as UserRole | null)
  })
  const [gmVerified, setGmVerified] = useState(() => isGMVerified())
  const [toasts, setToasts] = useState<Toast[]>([])
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([])

  // ALL hooks must be unconditional — no hooks after any early return
  const onDM = useCallback((dm: DirectMessage) => setDmMessages(prev => [...prev, dm]), [])
  const onDMRead = useCallback(() => setDmMessages(prev => prev.map(m => ({ ...m, read: true }))), [])
  const onAnnouncement = useCallback((label: string, text: string) => {
    setToasts(prev => [...prev, { id: crypto.randomUUID(), label, text, ts: Date.now() }].slice(-3))
  }, [])

  const { state, connected, send } = useWebSocket({ role: role ?? undefined, onAnnouncement, onDirectMessage: onDM })

  const dismissToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), [])
  const handleRoleSelect = useCallback((r: UserRole) => {
    localStorage.setItem(ROLE_KEY, r)
    if (r !== 'gm') clearGMVerified()
    setRole(r)
  }, [])

  // ── Render ──────────────────────────────────────────────────

  const connBadge = (
    <div className={`fixed top-2 right-2 text-xs px-2 py-1 font-hud z-50 ${
      connected ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900 animate-pulse'
    }`}>
      {connected ? '● ONLINE' : '● RECONNECTING'}
    </div>
  )

  const handleCharacterCreated = useCallback(() => {
    // Force a full state re-sync so the new character appears
    send({ type: 'full_state_sync_request' } as any)
  }, [send])

  if (!role) return (
    <>{connBadge}<RoleSelector characters={state?.characters ?? []} onSelect={handleRoleSelect} onCharacterCreated={handleCharacterCreated} /></>
  )

  if (role === 'gm') {
    if (!gmVerified) return <GMPinGate onVerified={() => setGmVerified(true)} />
    if (!state) return <div className="h-screen bg-hud-bg flex items-center justify-center font-hud text-hud-muted animate-pulse">SYNCING STATE...</div>
    return <>{connBadge}<GMDashboard state={state} send={send} /><ToastFeed toasts={toasts} onDismiss={dismissToast} /></>
  }

  const charId = role.replace('player:', '')
  const character = state?.characters.find(c => c.id === charId)

  if (!state || !character) return (
    <div className="h-screen bg-hud-bg flex flex-col items-center justify-center gap-4">
      {connBadge}
      <div className="font-hud text-hud-muted animate-pulse">CONNECTING TO SYSTEM...</div>
      <button onClick={() => { localStorage.removeItem(ROLE_KEY); setRole(null) }}
        className="font-hud text-xs text-hud-muted border border-hud-border px-3 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors">
        CHANGE CRAWLER
      </button>
    </div>
  )

  return (
    <>
      {connBadge}
      <PlayerHUD character={character} state={state} send={send} dmMessages={dmMessages} onDMRead={onDMRead} />
      <ToastFeed toasts={toasts} onDismiss={dismissToast} />
    </>
  )
}

export default App
