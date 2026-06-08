import { useState, useEffect } from 'react'

interface Campaign {
  id: string
  name: string
  slug: string
  roomCode: string
  rulesetConfig: any
  isActive: boolean
  createdAt: string
}

interface GMCampaignDashboardProps {
  token: string
  onSelectCampaign: (campaign: Campaign) => void
  onLogout: () => void
}

export function GMCampaignDashboard({ token, onSelectCampaign, onLogout }: GMCampaignDashboardProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Creation State
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [preset, setPreset] = useState<'dcc' | 'classic-fantasy'>('dcc')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchCampaigns = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error('Failed to retrieve campaigns list')
      }
      const data = await res.json()
      setCampaigns(data)
    } catch (err: any) {
      setError(err.message || 'Error loading campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [token])

  // Handle unique slug auto-fill
  useEffect(() => {
    if (name) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').trim())
    }
  }, [name])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug || !roomCode) {
      setCreateError('All fields are required.')
      return
    }

    setCreateLoading(true)
    setCreateError(null)

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          slug,
          roomCode,
          rulesetPreset: preset,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign')
      }

      // Success! Refresh list and reset form
      setShowCreate(false)
      setName('')
      setSlug('')
      setRoomCode('')
      fetchCampaigns()
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create campaign.')
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hud-bg flex flex-col p-8 select-none">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-hud-border pb-4 mb-8">
        <div>
          <div className="font-hud text-hud-accent text-xl tracking-widest">GM CO-PILOT SYSTEM</div>
          <div className="font-hud text-hud-muted text-xs tracking-wider">CAMPAIGN REGISTRY & MANAGER</div>
        </div>
        <button
          onClick={onLogout}
          className="font-hud text-xs border border-hud-border hover:border-red-500 hover:text-red-400 px-3 py-1.5 transition-colors"
        >
          DISCONNECT LOGOUT
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center font-hud text-hud-muted animate-pulse">
          FETCHING SECURE REGISTRY...
        </div>
      ) : error ? (
        <div className="border border-red-950 bg-red-950/20 p-6 rounded text-center">
          <div className="font-hud text-red-400 mb-2">SYSTEM LINK ERROR</div>
          <div className="font-hud text-xs text-hud-muted mb-4">{error}</div>
          <button onClick={fetchCampaigns} className="font-hud text-xs border border-hud-border px-3 py-1.5 hover:border-hud-accent hover:text-hud-accent">
            RETRY LINK
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Campaign List Grid */}
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-hud text-sm text-hud-accent tracking-widest">ACTIVE CAMPAIGNS</h2>
              {!showCreate && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="font-hud text-xs bg-hud-accent/10 border border-hud-accent text-hud-accent hover:bg-hud-accent hover:text-black px-4 py-2 transition-all font-bold"
                >
                  [ + NEW CAMPAIGN ]
                </button>
              )}
            </div>

            {campaigns.length === 0 ? (
              <div className="border border-dashed border-hud-border bg-hud-panel/40 p-12 text-center flex flex-col items-center gap-4">
                <div className="font-hud text-xs text-hud-muted">NO REGISTERED CAMPAIGNS FOUND</div>
                <button
                  onClick={() => setShowCreate(true)}
                  className="font-hud text-xs border border-hud-border px-4 py-2 hover:border-hud-accent hover:text-hud-accent transition-all"
                >
                  CREATE YOUR FIRST CAMPAIGN
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {campaigns.map((c) => {
                  const isDCC = c.rulesetConfig?.preset === 'dcc' || !c.rulesetConfig
                  return (
                    <div
                      key={c.id}
                      className="border border-hud-border bg-hud-panel p-6 flex flex-col justify-between gap-6 hover:border-hud-accent transition-colors"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`font-hud text-[10px] px-2 py-0.5 font-bold tracking-widest ${
                            isDCC ? 'bg-yellow-950 text-yellow-400 border border-yellow-800' : 'bg-blue-950 text-blue-400 border border-blue-900'
                          }`}>
                            {isDCC ? 'DCC CRAWLER' : 'DARK FANTASY'}
                          </span>
                          <span className="font-hud text-[10px] text-hud-muted tracking-widest">
                            PIN: {c.roomCode}
                          </span>
                        </div>
                        <h3 className="font-hud text-hud-accent text-base font-bold tracking-wide mt-2">{c.name}</h3>
                        <p className="font-hud text-[11px] text-hud-muted tracking-widest mt-1">
                          slug: {c.slug}
                        </p>
                      </div>

                      <button
                        onClick={() => onSelectCampaign(c)}
                        className="font-hud text-xs border border-hud-accent bg-hud-accent/5 text-hud-accent hover:bg-hud-accent hover:text-black py-2.5 transition-all text-center tracking-widest font-bold"
                      >
                        RUN CAMPAIGN PANEL
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Creation Form sidebar */}
          {showCreate && (
            <div className="w-full lg:w-96 border border-hud-border bg-hud-panel p-6 flex flex-col gap-5 shrink-0">
              <div className="flex justify-between items-center border-b border-hud-border pb-3">
                <span className="font-hud text-xs text-hud-accent tracking-widest font-bold">CREATE CAMPAIGN</span>
                <button onClick={() => setShowCreate(false)} className="font-hud text-xs text-hud-muted hover:text-red-400">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-hud text-[10px] text-hud-muted tracking-widest">CAMPAIGN NAME</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-hud-bg border border-hud-border focus:border-hud-accent font-hud text-xs text-hud-accent px-3 py-2 outline-none"
                    placeholder="BOPCA Season 2"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-hud text-[10px] text-hud-muted tracking-widest">URL SLUG</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="bg-hud-bg border border-hud-border focus:border-hud-accent font-hud text-xs text-hud-accent px-3 py-2 outline-none"
                    placeholder="bopca-2"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-hud text-[10px] text-hud-muted tracking-widest">PLAYER ROOM PIN (4 DIGITS)</label>
                  <input
                    type="text"
                    pattern="\d{4}"
                    maxLength={4}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
                    className="bg-hud-bg border border-hud-border focus:border-hud-accent font-hud text-xs text-hud-accent px-3 py-2 outline-none"
                    placeholder="0808"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-hud text-[10px] text-hud-muted tracking-widest">GAME TYPE PRESET</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setPreset('dcc')}
                      className={`font-hud text-[10px] py-2 border transition-all ${
                        preset === 'dcc'
                          ? 'border-yellow-500 bg-yellow-950/20 text-yellow-400 font-bold'
                          : 'border-hud-border hover:border-hud-accent text-hud-muted'
                      }`}
                    >
                      DCC CRAWLER
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreset('classic-fantasy')}
                      className={`font-hud text-[10px] py-2 border transition-all ${
                        preset === 'classic-fantasy'
                          ? 'border-blue-500 bg-blue-950/20 text-blue-400 font-bold'
                          : 'border-hud-border hover:border-hud-accent text-hud-muted'
                      }`}
                    >
                      DARK FANTASY
                    </button>
                  </div>
                </div>

                {createError && (
                  <div className="font-hud text-xs text-hp-low border border-red-950 bg-red-950/10 p-2 text-center">
                    {createError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createLoading}
                  className="font-hud text-xs bg-hud-accent/10 border border-hud-accent text-hud-accent hover:bg-hud-accent hover:text-black py-2.5 transition-all text-center tracking-widest font-bold mt-2"
                >
                  {createLoading ? 'SEEDING SECURE VAULT...' : '[ INITIALIZE CAMPAIGN ]'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
