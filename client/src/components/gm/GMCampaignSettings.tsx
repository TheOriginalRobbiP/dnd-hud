import { useState } from 'react'
import type { Campaign } from '../../types'

interface GMCampaignSettingsProps {
  campaign: Campaign | null | undefined
  onUpdateCampaign: (updatedCampaign: any) => void
}

const THEME_PRESETS = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon (DCC Default)',
    colors: {
      canvasColor: '#070B14',
      surfaceColor: '#0D1426',
      borderColor: '#1f2d4d',
      primaryColor: '#7B2FFF',
      accentColor: '#FFB800',
    }
  },
  {
    id: 'obsidian-ember',
    name: 'Obsidian Ember (Dark Fantasy)',
    colors: {
      canvasColor: '#0d0d0f',
      surfaceColor: '#161619',
      borderColor: '#2c251e',
      primaryColor: '#8c1d1d',
      accentColor: '#d49a3b',
    }
  },
  {
    id: 'dark-parchment',
    name: 'Dark Parchment (Classic RPG)',
    colors: {
      canvasColor: '#121210',
      surfaceColor: '#1d1c18',
      borderColor: '#3e3a31',
      primaryColor: '#99753a',
      accentColor: '#e8a957',
    }
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave Matrix (Retro Sci-Fi)',
    colors: {
      canvasColor: '#0b010f',
      surfaceColor: '#13031a',
      borderColor: '#300742',
      primaryColor: '#00f0ff',
      accentColor: '#ff007f',
    }
  }
]

export function GMCampaignSettings({ campaign, onUpdateCampaign }: GMCampaignSettingsProps) {
  if (!campaign) return null

  const [name, setName] = useState(campaign.name)
  const [roomCode, setRoomCode] = useState(campaign.roomCode)
  const [selectedThemeId, setSelectedThemeId] = useState(() => {
    // Guess active theme ID based on canvas color or fallback to cyberpunk
    const themeConfig = (campaign.themeConfig || {}) as any
    const activeCanvas = themeConfig.canvasColor || themeConfig.canvas
    const matched = THEME_PRESETS.find(p => p.colors.canvasColor === activeCanvas)
    return matched?.id || 'cyberpunk'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !roomCode) {
      setError('All fields are required.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    const token = localStorage.getItem('hud:gm_token')
    const chosenTheme = THEME_PRESETS.find(t => t.id === selectedThemeId)

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          roomCode,
          themeConfig: chosenTheme?.colors,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      setSuccess(true)
      onUpdateCampaign(data)
      // Automatically refresh styling dynamically on the document root!
      const root = document.documentElement
      root.style.setProperty('--theme-canvas', data.themeConfig.canvasColor)
      root.style.setProperty('--theme-surface', data.themeConfig.surfaceColor)
      root.style.setProperty('--theme-border', data.themeConfig.borderColor)
      root.style.setProperty('--theme-primary', data.themeConfig.primaryColor)
      root.style.setProperty('--theme-accent', data.themeConfig.accentColor)

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error updating settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-hud-border pb-4">
        <h2 className="font-hud text-lg text-hud-accent tracking-widest uppercase">CAMPAIGN CONFIG & STYLE</h2>
        <p className="font-hud text-xs text-hud-muted">Customize campaign rules, credentials, and visual themes.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Form fields */}
        <div className="flex-1 w-full border border-hud-border bg-hud-panel p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="font-hud text-[10px] text-hud-muted tracking-widest uppercase">CAMPAIGN NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-hud-bg border border-hud-border focus:border-hud-accent font-hud text-xs text-hud-accent px-3 py-2 outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-hud text-[10px] text-hud-muted tracking-widest uppercase">PLAYER JOIN PIN (4 DIGITS)</label>
            <input
              type="text"
              pattern="\d{4}"
              maxLength={4}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
              className="bg-hud-bg border border-hud-border focus:border-hud-accent font-hud text-xs text-hud-accent px-3 py-2 outline-none"
              required
            />
          </div>

          {error && (
            <div className="font-hud text-xs text-hp-low border border-red-950 bg-red-950/10 p-2 text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="font-hud text-xs text-hud-success border border-green-950 bg-green-950/10 p-2 text-center">
              ✓ SETTINGS UPDATED SUCCESSFULLY!
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="font-hud text-xs bg-hud-accent/10 border border-hud-accent text-hud-accent hover:bg-hud-accent hover:text-black py-2.5 transition-all text-center tracking-widest font-bold mt-2"
          >
            {loading ? 'SAVING CONFIG...' : '[ SAVE SYSTEM CONFIG ]'}
          </button>
        </div>

        {/* Theme select panel */}
        <div className="w-full lg:w-96 border border-hud-border bg-hud-panel p-6 flex flex-col gap-4 shrink-0">
          <label className="font-hud text-[10px] text-hud-muted tracking-widest uppercase">SELECT VISUAL SKIN (THEME)</label>
          
          <div className="flex flex-col gap-3">
            {THEME_PRESETS.map((preset) => {
              const isSelected = selectedThemeId === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedThemeId(preset.id)}
                  className={`border p-4 text-left flex flex-col gap-3 transition-colors ${
                    isSelected ? 'border-hud-accent bg-hud-accent/5' : 'border-hud-border hover:border-hud-muted bg-hud-bg/20'
                  }`}
                >
                  <span className={`font-hud text-xs font-bold ${isSelected ? 'text-hud-accent' : 'text-hud-text'}`}>
                    {preset.name}
                  </span>

                  {/* Tiny palette bar preview */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full border border-black" style={{ backgroundColor: preset.colors.canvasColor }} title="Canvas" />
                    <span className="w-4 h-4 rounded-full border border-black" style={{ backgroundColor: preset.colors.surfaceColor }} title="Surface" />
                    <span className="w-4 h-4 rounded-full border border-black" style={{ backgroundColor: preset.colors.borderColor }} title="Border" />
                    <span className="w-4 h-4 rounded-full border border-black" style={{ backgroundColor: preset.colors.primaryColor }} title="Primary" />
                    <span className="w-4 h-4 rounded-full border border-black" style={{ backgroundColor: preset.colors.accentColor }} title="Accent" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </form>
    </div>
  )
}
