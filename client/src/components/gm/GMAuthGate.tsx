import { useState } from 'react'

interface GMAuthGateProps {
  onLoginSuccess: (user: { id: string; email: string }, token: string) => void
  onBack: () => void
}

export function GMAuthGate({ onLoginSuccess, onBack }: GMAuthGateProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('All fields are required.')
      return
    }

    setLoading(true)
    setError(null)

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.')
      }

      onLoginSuccess(data.user, data.token)
    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-hud-bg flex flex-col items-center justify-center p-6 select-none">
      <div className="flex flex-col items-center gap-1 mb-6">
        <div className="font-hud text-hud-accent tracking-widest text-lg">GM CO-PILOT SYSTEM</div>
        <div className="font-hud text-hud-muted text-xs tracking-widest">
          {isRegister ? 'REGISTER NEW ACCOUNT' : 'LOGIN TO ACCESS CAMPAIGNS'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border border-hud-border bg-hud-panel w-full max-w-sm p-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="font-hud text-xs text-hud-muted tracking-widest">EMAIL ADDRESS</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="bg-hud-bg border border-hud-border focus:border-hud-accent font-hud text-sm text-hud-accent px-3 py-2 outline-none"
            placeholder="gm@campaign.io"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-hud text-xs text-hud-muted tracking-widest">PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="bg-hud-bg border border-hud-border focus:border-hud-accent font-hud text-sm text-hud-accent px-3 py-2 outline-none"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="font-hud text-xs text-hp-low text-center border border-red-950 bg-red-950/20 p-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`font-hud text-xs py-3 tracking-widest font-bold border transition-all ${
            loading
              ? 'bg-hud-panel border-hud-border text-hud-muted animate-pulse cursor-not-allowed'
              : 'bg-hud-accent/10 border-hud-accent text-hud-accent hover:bg-hud-accent hover:text-black cursor-pointer'
          }`}
        >
          {loading ? 'PROCESSING...' : isRegister ? 'REGISTER GM' : 'SYSTEM LOGIN'}
        </button>

        <div className="flex justify-between items-center mt-2">
          <button
            type="button"
            onClick={onBack}
            className="font-hud text-xs text-hud-muted hover:text-hud-accent transition-colors"
          >
            ← CANCEL
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setError(null)
            }}
            className="font-hud text-xs text-hud-accent hover:underline"
          >
            {isRegister ? 'EXISTING ACCOUNT?' : 'NEED AN ACCOUNT?'}
          </button>
        </div>
      </form>
    </div>
  )
}
