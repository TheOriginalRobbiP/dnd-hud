import { useState, useCallback } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { RoleSelector } from './components/shared/RoleSelector'
import { GMDashboard } from './components/gm/GMDashboard'
import { GMAuthGate } from './components/gm/GMAuthGate'
import { GMCampaignDashboard } from './components/gm/GMCampaignDashboard'
import { PlayerHUD } from './components/player/PlayerHUD'
import { ToastFeed } from './components/shared/ToastFeed'
import { DisplayScreen } from './components/display/DisplayScreen'
import { ThemeProvider } from './components/shared/ThemeProvider'
import type { UserRole } from './types'
import type { DirectMessage } from './hooks/useWebSocket'
import type { Toast } from './components/shared/ToastFeed'

// ── Display route detection ───────────────────────────────────
const isDisplayRoute =
  window.location.pathname === '/display' ||
  new URLSearchParams(window.location.search).get('display') === '1'

const ROLE_KEY = 'hud:role'
const TOKEN_KEY = 'hud:gm_token'
const CAMPAIGN_KEY = 'hud:active_campaign_id'

function App() {
  // Short-circuit for display screen — no auth, no role, no hooks overlap
  if (isDisplayRoute) return <DisplayScreen />

  const [role, setRole] = useState<UserRole | null>(() => {
    return (localStorage.getItem(ROLE_KEY) as UserRole | null)
  })
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY)
  })
  
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(() => {
    return localStorage.getItem(CAMPAIGN_KEY)
  })

  const [toasts, setToasts] = useState<Toast[]>([])
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([])

  // ALL hooks must be unconditional — no hooks after any early return
  const onDM = useCallback((dm: DirectMessage) => setDmMessages(prev => [...prev, dm]), [])
  const onDMRead = useCallback(() => setDmMessages(prev => prev.map(m => ({ ...m, read: true }))), [])
  const onAnnouncement = useCallback((label: string, text: string) => {
    setToasts(prev => [...prev, { id: crypto.randomUUID(), label, text, ts: Date.now() }].slice(-3))
  }, [])

  // Pass the campaignId to our websocket hook
  const { state, connected, send, activeCharIds } = useWebSocket({ 
    role: role ?? undefined, 
    campaignId: activeCampaignId ?? undefined,
    onAnnouncement, 
    onDirectMessage: onDM 
  })

  const dismissToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), [])
  
  const handleRoleSelect = useCallback((r: UserRole) => {
    localStorage.setItem(ROLE_KEY, r)
    setRole(r)
  }, [])

  const handleLoginSuccess = useCallback((_user: any, newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
  }, [])

  const handleSelectCampaign = useCallback((campaign: { id: string }) => {
    localStorage.setItem(CAMPAIGN_KEY, campaign.id)
    setActiveCampaignId(campaign.id)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(CAMPAIGN_KEY)
    setToken(null)
    setActiveCampaignId(null)
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
    <ThemeProvider campaign={state?.campaign}>
      {connBadge}
      <RoleSelector characters={state?.characters ?? []} sessionActive={state?.floor?.sessionActive ?? false} onSelect={handleRoleSelect} onCharacterCreated={handleCharacterCreated} />
    </ThemeProvider>
  )

  if (role === 'gm') {
    // 1. GM needs credentials login
    if (!token) return (
      <ThemeProvider campaign={state?.campaign}>
        <GMAuthGate
          onLoginSuccess={handleLoginSuccess}
          onBack={() => {
            localStorage.removeItem(ROLE_KEY)
            setRole(null)
          }}
        />
      </ThemeProvider>
    )

    // 2. GM needs to select or create a Campaign
    if (!activeCampaignId) return (
      <ThemeProvider campaign={state?.campaign}>
        <GMCampaignDashboard
          token={token}
          onSelectCampaign={handleSelectCampaign}
          onLogout={handleLogout}
        />
      </ThemeProvider>
    )

    // 3. Render full GMDashboard once authorized & campaign is selected
    if (!state) return <div className="h-screen bg-hud-bg flex items-center justify-center font-hud text-hud-muted animate-pulse">SYNCING STATE...</div>
    
    return (
      <ThemeProvider campaign={state?.campaign}>
        {connBadge}
        <GMDashboard
          state={state}
          send={send}
          activeCharIds={activeCharIds}
          dmMessages={dmMessages}
          onDMRead={onDMRead}
          onDMEcho={onDM}
        />
        
        {/* Back to Campaigns overlay switch */}
        <div className="fixed bottom-2 right-2 z-50">
          <button
            onClick={() => {
              localStorage.removeItem(CAMPAIGN_KEY)
              setActiveCampaignId(null)
            }}
            className="font-hud text-[10px] bg-hud-panel border border-hud-border text-hud-muted px-2 py-1 hover:text-hud-accent hover:border-hud-accent transition-colors"
          >
            ← CAMPAIGNS DASHBOARD
          </button>
        </div>

        <ToastFeed toasts={toasts} onDismiss={dismissToast} />
      </ThemeProvider>
    )
  }

  const charId = role.replace('player:', '')
  const character = state?.characters.find(c => c.id === charId)

  if (!state || !character) return (
    <ThemeProvider campaign={state?.campaign}>
      <div className="h-screen bg-hud-bg flex flex-col items-center justify-center gap-4">
        {connBadge}
        <div className="font-hud text-hud-muted animate-pulse">CONNECTING TO SYSTEM...</div>
        <button onClick={() => { localStorage.removeItem(ROLE_KEY); setRole(null) }}
          className="font-hud text-xs text-hud-muted border border-hud-border px-3 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors">
          CHANGE CRAWLER
        </button>
      </div>
    </ThemeProvider>
  )

  return (
    <ThemeProvider campaign={state?.campaign}>
      {connBadge}
      <PlayerHUD
        character={character}
        state={state}
        send={send}
        activeCharIds={activeCharIds}
        dmMessages={dmMessages}
        onDMRead={onDMRead}
        onDMEcho={onDM}
      />
      <ToastFeed toasts={toasts} onDismiss={dismissToast} />
    </ThemeProvider>
  )
}

export default App
