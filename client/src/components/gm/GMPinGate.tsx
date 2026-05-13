import { useState, useRef, useEffect } from 'react'

const PIN_SESSION_KEY = 'hud:gm-verified'

interface GMPinGateProps {
  onVerified: () => void
}

export function GMPinGate({ onVerified }: GMPinGateProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [locked, setLocked] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Already verified this session
    if (sessionStorage.getItem(PIN_SESSION_KEY) === 'true') {
      onVerified()
      return
    }
    inputRef.current?.focus()
  }, [onVerified])

  const verify = async () => {
    if (!pin.trim() || loading || locked) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
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
        inputRef.current?.focus()
      }
    } catch {
      setError('Connection error. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') verify()
  }

  return (
    <div className="h-screen bg-hud-bg flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-1 mb-2">
        <div className="font-hud text-hud-accent tracking-widest text-lg">GM CONSOLE</div>
        <div className="font-hud text-hud-muted text-sm tracking-wider">RESTRICTED ACCESS</div>
      </div>

      <div className="border border-hud-border bg-hud-panel w-full max-w-xs p-6 flex flex-col gap-4">
        <div className="font-hud text-xs text-hud-muted tracking-widest text-center">
          ENTER GM PIN TO CONTINUE
        </div>

        <input
          ref={inputRef}
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading || locked}
          placeholder="••••"
          className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-center text-2xl tracking-widest p-3 focus:border-hud-accent outline-none disabled:opacity-40"
        />

        {error && (
          <div className="font-hud text-xs text-hp-low text-center">{error}</div>
        )}

        <button
          onClick={verify}
          disabled={!pin.trim() || loading || locked}
          className="w-full border border-hud-accent text-hud-accent font-hud py-2 tracking-widest hover:bg-hud-accent hover:text-hud-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          {loading ? 'VERIFYING...' : locked ? 'LOCKED' : 'ENTER'}
        </button>
      </div>

      <div className="font-hud text-xs text-hud-muted text-center max-w-xs">
        This console is restricted to the Game Master.<br />
        If you are a Crawler, go back and select your character.
      </div>
    </div>
  )
}

// Helper — call this to check if already verified (e.g. on hot reload)
export function isGMVerified(): boolean {
  return sessionStorage.getItem(PIN_SESSION_KEY) === 'true'
}

// Call this on role change / logout
export function clearGMVerified(): void {
  sessionStorage.removeItem(PIN_SESSION_KEY)
}
