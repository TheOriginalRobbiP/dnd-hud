import { useEffect, useRef, useState } from 'react'

export function ViewerCounter({ viewerCount }: { viewerCount: number }) {
  const [displayed, setDisplayed] = useState(viewerCount)
  const prevRef = useRef(viewerCount)

  useEffect(() => {
    const from = prevRef.current
    if (viewerCount <= from) { setDisplayed(viewerCount); prevRef.current = viewerCount; return }
    const steps = 30
    const diff = viewerCount - from
    let step = 0
    const interval = setInterval(() => {
      step++
      setDisplayed(Math.round(from + (diff * step / steps)))
      if (step >= steps) { clearInterval(interval); prevRef.current = viewerCount }
    }, 1000 / steps)
    return () => clearInterval(interval)
  }, [viewerCount])

  return (
    <div className="p-4 border border-hud-border">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-red-500 animate-pulse text-sm">●</span>
        <span className="font-hud text-sm text-hud-muted tracking-widest">LIVE VIEWERS</span>
      </div>
      <div className="font-hud text-5xl text-hud-accent">{displayed.toLocaleString()}</div>
    </div>
  )
}
