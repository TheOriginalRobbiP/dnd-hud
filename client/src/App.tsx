import { useState, useCallback, useEffect } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { RoleSelector } from './components/shared/RoleSelector'
import { GMDashboard } from './components/gm/GMDashboard'
import { GMAuthGate } from './components/gm/GMAuthGate'
import { GMCampaignDashboard } from './components/gm/GMCampaignDashboard'
import { PlayerHUD } from './components/player/PlayerHUD'
import { ToastFeed } from './components/shared/ToastFeed'
import { DisplayScreen } from './components/display/DisplayScreen'
import { ThemeProvider } from './components/shared/ThemeProvider'
import { PinJoinScreen } from './components/shared/PinJoinScreen'
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

interface ParsedRoute {
  campaignSlug: string
  subView: 'spectator' | 'gm' | 'p' | 'join'
  characterId?: string
}

function parsePath(): ParsedRoute | null {
  const parts = window.location.pathname.split('/').filter(Boolean)
  if (parts[0] === 'c' && parts[1]) {
    return {
      campaignSlug: parts[1],
      subView: (parts[2] as any) || 'spectator',
      characterId: parts[2] === 'p' ? parts[3] : undefined,
    }
  }
  return null
}

function App() {
  // Short-circuit for display screen — no auth, no role, no hooks overlap
  if (isDisplayRoute) return <DisplayScreen />

  // ── Route Parsing ──────────────────────────────────────────
  const [route] = useState<ParsedRoute | null>(() => parsePath())

  const [role, setRole] = useState<UserRole | null>(() => {
    // If we're on a direct player route /c/:slug/p/:charId, force the player role!
    const parsed = parsePath()
    if (parsed && parsed.subView === 'p' && parsed.characterId) {
      return `player:${parsed.characterId}` as UserRole
    }
    // If we're on a GM route /c/:slug/gm, force GM role!
    if (parsed && parsed.subView === 'gm') {
      return 'gm'
    }
    return (localStorage.getItem(ROLE_KEY) as UserRole | null)
  })
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY)
  })
  
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(() => {
    return localStorage.getItem(CAMPAIGN_KEY)
  })

  const [campaignInfo, setCampaignInfo] = useState<any | null>(null)
  const [resolvingCampaign, setResolvingCampaign] = useState(false)
  const [campaignError, setCampaignError] = useState<string | null>(null)

  const [toasts, setToasts] = useState<Toast[]>([])
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([])

  // ── Resolve Campaign Metadata by Slug ───────────────────────
  useEffect(() => {
    if (route?.campaignSlug) {
      setResolvingCampaign(true)
      setCampaignError(null)
      fetch(`/api/campaigns/by-slug/${route.campaignSlug}`)
        .then((res) => {
          if (!res.ok) throw new Error('Campaign module not found')
          return res.json()
        })
        .then((data) => {
          setCampaignInfo(data)
          setActiveCampaignId(data.id)
          localStorage.setItem(CAMPAIGN_KEY, data.id)
        })
        .catch((err) => {
          setCampaignError(err.message || 'Error resolving campaign.')
        })
        .finally(() => {
          setResolvingCampaign(false)
        })
    } else {
      // Not on a campaign subroute — we are on the home page or general GM selection!
      setCampaignInfo(null)
      // Only clear campaignId if we're not inside the GMDashboard workflow
      if (role !== 'gm') {
        setActiveCampaignId(null)
        localStorage.removeItem(CAMPAIGN_KEY)
      }
    }
  }, [route?.campaignSlug, role])

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
    
    // If GMs or players select role inside a scoped campaign, update URL gracefully!
    if (campaignInfo?.slug) {
      if (r === 'gm') {
        window.history.pushState({}, '', `/c/${campaignInfo.slug}/gm`)
      } else if (r.startsWith('player:')) {
        const charId = r.replace('player:', '')
        window.history.pushState({}, '', `/c/${campaignInfo.slug}/p/${charId}`)
      }
    }
  }, [campaignInfo])

  const handleLoginSuccess = useCallback((_user: any, newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
  }, [])

  const handleSelectCampaign = useCallback((campaign: { id: string; slug: string }) => {
    localStorage.setItem(CAMPAIGN_KEY, campaign.id)
    setActiveCampaignId(campaign.id)
    // Redirect GM to campaign-specific GM control panel!
    window.location.pathname = `/c/${campaign.slug}/gm`
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(CAMPAIGN_KEY)
    setToken(null)
    setActiveCampaignId(null)
    window.location.pathname = '/'
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

  if (role === 'gm') {
    // 1. GM needs credentials login
    if (!token) return (
      <ThemeProvider campaign={campaignInfo}>
        <GMAuthGate
          onLoginSuccess={handleLoginSuccess}
          onBack={() => {
            localStorage.removeItem(ROLE_KEY)
            setRole(null)
            window.location.pathname = '/'
          }}
        />
      </ThemeProvider>
    )

    // 2. GM on root "/" or without active campaign should see their Campaign Selector
    if (!activeCampaignId || !route) return (
      <ThemeProvider campaign={campaignInfo}>
        <GMCampaignDashboard
          token={token}
          onSelectCampaign={handleSelectCampaign}
          onLogout={handleLogout}
        />
      </ThemeProvider>
    )
  }

  // 1. If on root `/` (No Campaign selected or parsed), show PIN joining panel or login link
  if (!route) {
    return (
      <ThemeProvider campaign={state?.campaign}>
        <PinJoinScreen
          onGoToGM={() => {
            // Force role to GM and let auth render
            localStorage.setItem(ROLE_KEY, 'gm')
            setRole('gm')
          }}
        />
      </ThemeProvider>
    )
  }

  // 2. If campaign is resolving via API slug search
  if (resolvingCampaign) {
    return (
      <div className="h-screen bg-hud-bg flex flex-col items-center justify-center font-hud text-hud-muted animate-pulse">
        RESOLVING CAMPAIGN MODULE SYSTEMS...
      </div>
    )
  }

  // 3. If campaign slug didn't match any record in Postgres database
  if (campaignError) {
    return (
      <div className="h-screen bg-hud-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="font-hud text-hp-low text-lg mb-2">SYSTEM ERROR: INVALID PORTAL</div>
        <div className="font-hud text-xs text-hud-muted mb-6 max-w-sm">
          No campaign matched slug "{route.campaignSlug}". The game PIN may be stale, or the campaign slug was renamed.
        </div>
        <button
          onClick={() => { window.location.pathname = '/' }}
          className="font-hud text-xs border border-hud-border hover:border-hud-accent hover:text-hud-accent px-4 py-2 transition-all"
        >
          ← EXIT TO MAIN ENTRYPORT
        </button>
      </div>
    )
  }

  // 4. Role Gating inside campaign
  if (!role) {
    return (
      <ThemeProvider campaign={campaignInfo}>
        {connBadge}
        <RoleSelector 
          characters={state?.characters ?? []} 
          sessionActive={state?.floor?.sessionActive ?? false} 
          onSelect={handleRoleSelect} 
          onCharacterCreated={handleCharacterCreated} 
        />
      </ThemeProvider>
    )
  }

  if (role === 'gm') {
    // Render full GMDashboard once authorized & campaign is selected
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
              window.location.pathname = '/'
            }}
            className="font-hud text-[10px] bg-hud-panel border border-hud-border text-hud-muted px-2 py-1 hover:text-hud-accent hover:border-hud-accent transition-colors"
          >
            ← LEAVE CAMPAIGN
          </button>
        </div>

        <ToastFeed toasts={toasts} onDismiss={dismissToast} />
      </ThemeProvider>
    )
  }

  const charId = role.replace('player:', '')
  const character = state?.characters.find(c => c.id === charId)

  if (!state || !character) return (
    <ThemeProvider campaign={campaignInfo}>
      <div className="h-screen bg-hud-bg flex flex-col items-center justify-center gap-4">
        {connBadge}
        <div className="font-hud text-hud-muted animate-pulse font-bold">CONNECTING TO STREAM SERVER...</div>
        <button onClick={() => { localStorage.removeItem(ROLE_KEY); setRole(null); window.location.pathname = `/c/${campaignInfo?.slug}` }}
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
