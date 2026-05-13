import { useEffect } from 'react'
import { useState } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'announcement' | 'achievement' | 'loot' | 'warning'
  expiresAt: number
}

interface ToastOverlayProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

const ICONS: Record<Toast['type'], string> = {
  announcement: '📡',
  achievement: '🏆',
  loot: '📦',
  warning: '⚠️',
}

const BORDER_COLOURS: Record<Toast['type'], string> = {
  announcement: 'border-hud-accent',
  achievement: 'border-yellow-400',
  loot: 'border-tier-platinum',
  warning: 'border-hp-low',
}

export function ToastOverlay({ toasts, onDismiss }: ToastOverlayProps) {
  // Auto-dismiss
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      toasts.filter(t => t.expiresAt < now).forEach(t => onDismiss(t.id))
    }, 500)
    return () => clearInterval(interval)
  }, [toasts, onDismiss])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 max-w-xs w-full pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id}
          className={`bg-hud-panel border-l-4 ${BORDER_COLOURS[toast.type]} px-4 py-3 
                     flex gap-3 items-start shadow-lg animate-slide-in pointer-events-auto`}
          onClick={() => onDismiss(toast.id)}
          role="status"
          aria-live="polite">
          <span className="text-lg flex-shrink-0">{ICONS[toast.type]}</span>
          <p className="font-hud text-sm text-hud-text leading-relaxed">{toast.message}</p>
        </div>
      ))}
    </div>
  )
}
