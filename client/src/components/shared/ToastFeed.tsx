import { useEffect } from 'react'

export interface Toast {
  id: string
  label: string
  text: string
  ts: number
}

interface ToastFeedProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastFeed({ toasts, onDismiss }: ToastFeedProps) {
  // Auto-dismiss after 6s
  useEffect(() => {
    const timers = toasts.map(t =>
      setTimeout(() => onDismiss(t.id), 6000)
    )
    return () => timers.forEach(clearTimeout)
  }, [toasts, onDismiss])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 max-w-sm">
      {toasts.slice(-3).map(t => (
        <div key={t.id}
          className="border-l-2 border-purple-500 bg-hud-panel border border-hud-border p-3 flex gap-3 items-start shadow-lg"
          style={{ animation: 'slideIn 0.2s ease-out' }}>
          <div className="flex-1">
            <div className="font-hud text-sm text-hud-muted tracking-widest mb-1">
              SYSTEM — {t.label.toUpperCase()}
            </div>
            <div className="font-hud text-sm text-hud-text italic">{t.text}</div>
          </div>
          <button onClick={() => onDismiss(t.id)}
            className="font-hud text-hud-muted text-sm hover:text-red-400 transition-colors mt-0.5">✕</button>
        </div>
      ))}
    </div>
  )
}
