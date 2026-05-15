import { useState, useEffect } from 'react'

const PIN_SESSION_KEY = 'hud:gm-verified'

interface GMPinGateProps {
  onVerified: () => void
}

const NUMPAD = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'] as const

export function GMPinGate({ onVerified }: GMPinGateProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(PIN_SESSION_KEY) === 'true') {
      onVerified()
    }
  }, [onVerified])

  const verify = async (pinToCheck = pin) => {
    if (!pinToCheck.trim() || loading || locked) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToCheck }),
      })
      const data = await res.json()
      if (data.ok) {
        sessionStorage.setItem(PIN_SESSION_KEY, 'true')
        onVerified()
      } else if (res.status === 429) {
        setLocked(true)
        setError(data.error ?? 'Too many attempts. Wait 60 seconds.')
        setTimeout(() => { setLocked(false); setError(null) }, 60_000)
      } else {
        const left = data.remaining ?? '?'
        setError(`Incorrect. ${left} attempt${left === 1 ? '' : 's'} remaining.`)
        setPin('')
      }
    } catch {
      setError('Connection error. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  const handlePad = (key: typeof NUMPAD[number]) => {
    if (locked || loading) return
    if (key === '⌫') { setPin(p => p.slice(0, -1)); setError(null); return }
    if (key === '✓') { verify(); return }
    if (pin.length >= 8) return
    const next = pin + key
    setPin(next)
  }

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { verify(); return }
      if (e.key === 'Backspace') { setPin(p => p.slice(0, -1)); setError(null); return }
      if (/^\d$/.test(e.key) && pin.length < 8) setPin(p => p + e.key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pin, loading, locked])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  return (
    <div className="h-screen bg-hud-bg flex flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-1 mb-2">
        <div className="font-hud text-hud-accent tracking-widest text-lg">GM CONSOLE</div>
        <div className="font-hud text-hud-muted text-sm tracking-wider">RESTRICTED ACCESS</div>
      </div>

      <div className="border border-hud-border bg-hud-panel w-full max-w-xs p-5 flex flex-col gap-4">
        <div className="font-hud text-xs text-hud-muted tracking-widest text-center">
          ENTER GM PIN
        </div>

        {/* PIN display — no actual input, just dots */}
        <div className={`border font-hud text-2xl tracking-[0.5em] text-center py-3 select-none transition-colors ${
          error ? 'border-red-800 text-red-400' : 'border-hud-border text-hud-accent'
        }`}>
          {pin ? '●'.repeat(pin.length) : <span className="text-hud-border text-base tracking-widest">_ _ _ _</span>}
        </div>

        {error && (
          <div className="font-hud text-xs text-hp-low text-center">{error}</div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {NUMPAD.map(key => (
            <button
              key={key}
              onClick={() => handlePad(key)}
              disabled={locked}
              className={`font-hud py-3 text-xl border transition-colors disabled:opacity-30 ${
                key === '✓'
                  ? 'border-hud-accent text-hud-accent hover:bg-hud-accent hover:text-hud-bg'
                  : key === '⌫'
                  ? 'border-hud-border text-hud-muted hover:border-hp-low hover:text-hp-low'
                  : 'border-hud-border text-hud-text hover:border-hud-accent hover:text-hud-accent'
              } ${loading && key === '✓' ? 'opacity-50' : ''}`}
            >
              {loading && key === '✓' ? '…' : key}
            </button>
          ))}
        </div>
      </div>

      <div className="font-hud text-xs text-hud-muted text-center max-w-xs opacity-60">
        This console is restricted to the Game Master.
      </div>
    </div>
  )
}

export function isGMVerified(): boolean {
  return sessionStorage.getItem(PIN_SESSION_KEY) === 'true'
}

export function clearGMVerified(): void {
  sessionStorage.removeItem(PIN_SESSION_KEY)
}
