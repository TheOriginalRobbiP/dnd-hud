import { useState } from 'react'
import type { WSMessage } from '../../types'

interface SoundboardPanelProps {
  send: (msg: WSMessage) => void
}

interface SoundLine {
  id: string
  label: string
  category: string
}

const LINES: SoundLine[] = [
  { id: 'session_start',       label: 'Session Start',    category: 'Session' },
  { id: 'session_stop',        label: 'Session Stop',     category: 'Session' },
  { id: 'room_generic',        label: 'Room Enter',       category: 'Room' },
  { id: 'room_boss',           label: 'Boss Room',        category: 'Room' },
  { id: 'room_trap',           label: 'Trap Room',        category: 'Room' },
  { id: 'room_loot',           label: 'Loot Room',        category: 'Room' },
  { id: 'room_safe',           label: 'Safe Room',        category: 'Room' },
  { id: 'room_narrative',      label: 'Narrative Room',   category: 'Room' },
  { id: 'achievement_standard',label: 'Achievement',      category: 'Achievement' },
  { id: 'achievement_rare',    label: 'Rare Achievement', category: 'Achievement' },
  { id: 'loot_box',            label: 'Loot Box',         category: 'Loot' },
  { id: 'loot_legendary',      label: 'Legendary Drop',   category: 'Loot' },
  { id: 'timer_30s',           label: '30s Warning',      category: 'Timer' },
  { id: 'timer_expired',       label: 'Timer Expired',    category: 'Timer' },
  { id: 'ai_favour',           label: 'Favour Granted',   category: 'AI Favour' },
  { id: 'ai_favour_spent',     label: 'Favour Spent',     category: 'AI Favour' },
]

const CATEGORY_COLOURS: Record<string, string> = {
  'Session':     'border-hud-accent text-hud-accent',
  'Room':        'border-blue-400 text-blue-400',
  'Achievement': 'border-yellow-400 text-yellow-400',
  'Loot':        'border-green-400 text-green-400',
  'Timer':       'border-red-400 text-red-400',
  'AI Favour':   'border-purple-400 text-purple-400',
}

const CATEGORIES = Array.from(new Set(LINES.map(l => l.category)))

export function SoundboardPanel({ send }: SoundboardPanelProps) {
  const [playing, setPlaying] = useState<string | null>(null)
  const [volume, setVolume] = useState(0.8)

  const play = (line: SoundLine) => {
    // Broadcast to all clients via WS so display screen plays it too
    send({ type: 'play_sound', soundId: line.id } as WSMessage)

    // Also play locally for GM preview
    const audio = new Audio(`/audio/${line.id}.mp3`)
    audio.volume = volume
    setPlaying(line.id)
    audio.play()
    audio.onended = () => setPlaying(null)
    audio.onerror = () => setPlaying(null)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-hud text-hud-accent tracking-widest text-sm">SYSTEM AI — SOUNDBOARD</h2>
        <div className="flex items-center gap-2">
          <span className="font-hud text-hud-muted text-xs">VOL</span>
          <input
            type="range"
            min={0} max={1} step={0.05}
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="w-20 accent-hud-accent"
          />
          <span className="font-hud text-hud-muted text-xs w-6">{Math.round(volume * 100)}</span>
        </div>
      </div>

      {/* Categories */}
      {CATEGORIES.map(cat => (
        <div key={cat}>
          <p className={`font-hud text-xs tracking-widest mb-2 ${CATEGORY_COLOURS[cat] ?? 'text-hud-muted'}`}>
            {cat.toUpperCase()}
          </p>
          <div className="flex flex-wrap gap-2">
            {LINES.filter(l => l.category === cat).map(line => {
              const isPlaying = playing === line.id
              const colour = CATEGORY_COLOURS[cat] ?? 'border-hud-border text-hud-muted'
              return (
                <button
                  key={line.id}
                  onClick={() => play(line)}
                  disabled={isPlaying}
                  className={`px-3 py-2 border font-hud text-xs tracking-wider transition-all
                    ${isPlaying
                      ? 'border-hud-accent text-hud-accent bg-hud-accent/10 animate-pulse cursor-not-allowed'
                      : `${colour} border-opacity-40 hover:border-opacity-100 hover:bg-white/5`
                    }`}
                >
                  {isPlaying ? '▶ PLAYING' : line.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
