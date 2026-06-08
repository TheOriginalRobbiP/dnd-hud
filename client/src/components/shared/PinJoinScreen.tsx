import { useState } from 'react'

interface PinJoinScreenProps {
  onGoToGM: () => void
}

export function PinJoinScreen({ onGoToGM }: PinJoinScreenProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 4) {
      setError('PIN must be 4 digits.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/campaigns/by-pin/${pin}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Campaign not found for this PIN.')
      }

      // Found! Redirect player to the campaign slug room
      window.location.pathname = `/c/${data.slug}`
    } catch (err: any) {
      setError(err.message || 'Connection error.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (num: string) => {
    if (loading) return
    setError(null)
    if (pin.length < 4) {
      setPin(p => p + num)
    }
  }

  const handleBackspace = () => {
    if (loading) return
    setError(null)
    setPin(p => p.slice(0, -1))
  }

  return (
    <div className="h-screen bg-hud-bg flex flex-col items-center justify-center p-6 select-none">
      <div className="flex flex-col items-center gap-1 mb-6">
        <div className="font-hud text-hud-accent tracking-widest text-xl">DND HUD PORTAL</div>
        <div className="font-hud text-hud-muted text-xs tracking-widest">ENTER 4-DIGIT CAMPAIGN PIN</div>
      </div>

      <form onSubmit={handleSubmit} className="border border-hud-border bg-hud-panel w-full max-w-xs p-6 flex flex-col gap-4">
        {/* Digital display */}
        <div className={`border font-hud text-3xl tracking-widest text-center py-3 select-none transition-colors ${
          error ? 'border-red-950 text-red-400' : 'border-hud-border text-hud-accent'
        }`}>
          {pin ? pin.split('').map(() => '●').join(' ') : <span className="text-hud-border/40 text-base tracking-widest">_ _ _ _</span>}
        </div>

        {error && (
          <div className="font-hud text-[11px] text-hp-low text-center leading-tight">
            {error}
          </div>
        )}

        {/* Dynamic retro grid pad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="font-hud text-base py-2.5 border border-hud-border bg-hud-bg/40 text-hud-muted hover:border-hud-accent hover:text-hud-accent transition-colors font-bold"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="font-hud text-xs py-2.5 border border-hud-border bg-hud-bg/40 text-hud-muted hover:border-hud-accent hover:text-hud-accent transition-colors font-bold"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="font-hud text-base py-2.5 border border-hud-border bg-hud-bg/40 text-hud-muted hover:border-hud-accent hover:text-hud-accent transition-colors font-bold"
          >
            0
          </button>
          <button
            type="submit"
            disabled={loading || pin.length !== 4}
            className={`font-hud text-xs py-2.5 border font-bold transition-all ${
              pin.length === 4 && !loading
                ? 'border-hud-accent bg-hud-accent/10 text-hud-accent hover:bg-hud-accent hover:text-black'
                : 'border-hud-border text-hud-border bg-hud-panel cursor-not-allowed'
            }`}
          >
            {loading ? '...' : '✓ JOIN'}
          </button>
        </div>

        <div className="border-t border-hud-border/40 pt-4 text-center">
          <button
            type="button"
            onClick={onGoToGM}
            className="font-hud text-xs text-hud-muted hover:text-hud-accent transition-colors underline"
          >
            GM PANEL CONSOLE →
          </button>
        </div>
      </form>
    </div>
  )
}
