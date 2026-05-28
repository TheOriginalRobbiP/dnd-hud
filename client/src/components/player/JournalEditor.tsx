import { useState, useEffect, useRef } from 'react'
import type { WSMessage } from '../../types'

interface JournalEditorProps {
  characterId: string
  crawlerName: string
  initialNotes: string
  send: (msg: WSMessage) => void
}

export function JournalEditor({ characterId, crawlerName, initialNotes, send }: JournalEditorProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'typing' | 'saving' | 'saved'>('idle')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  // Handle external updates to notes (e.g., from DB sync)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    setNotes(initialNotes)
    setSyncStatus('saved')
  }, [initialNotes])

  const handleChange = (val: string) => {
    setNotes(val)
    setSyncStatus('typing')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSyncStatus('saving')
      send({
        type: 'player_notes_update',
        charId: characterId,
        notes: val,
      } as any)
      setSyncStatus('saved')
    }, 1000)
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-hud-panel border border-hud-border rounded-xl p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-hud-border pb-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗒️</span>
          <div>
            <div className="font-hud text-xs text-hud-accent tracking-[0.2em] uppercase font-bold">CRAWLER JOURNAL</div>
            <div className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mt-0.5">
              SECURE SECTOR ENCRYPTED DATABASE LOG
            </div>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="font-hud text-[9px] tracking-widest uppercase flex items-center gap-2 bg-hud-bg/50 px-2 py-1 rounded border border-hud-border/20">
          {syncStatus === 'idle' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-hud-muted"></span>
              <span className="text-hud-muted">STANDBY</span>
            </>
          )}
          {syncStatus === 'typing' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
              <span className="text-yellow-500">INPUTTING...</span>
            </>
          )}
          {syncStatus === 'saving' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-spin"></span>
              <span className="text-cyan-400">UPLOADING...</span>
            </>
          )}
          {syncStatus === 'saved' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-hud-success"></span>
              <span className="text-hud-success">✓ SYNCHRONIZED</span>
            </>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <textarea
          value={notes}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Write notes here, ${crawlerName}. Clues, level-up plans, loot locations... Everything is saved automatically.`}
          className="flex-1 w-full bg-hud-bg text-hud-text font-mono text-xs p-4 border border-hud-border/60 rounded-lg focus:border-hud-accent focus:outline-none resize-none leading-relaxed placeholder-hud-muted/30"
          style={{
            backgroundImage: 'linear-gradient(rgba(18, 18, 22, 0.1) 96%, rgba(245, 158, 11, 0.05) 96%)',
            backgroundSize: '100% 2rem',
            lineHeight: '2rem',
          }}
        />

        {/* Borant Warning footer inside the editor */}
        <div className="text-[9px] text-hud-muted italic mt-3 opacity-50 flex items-center gap-1.5 leading-none">
          <span className="text-hud-accent font-bold">⚠️ BORANT SECURITY PROTOCOL 12-B:</span>
          <span>Derogatory remarks targeting System AI or Syndicate sponsors are subject to immediate viewer rating penalties.</span>
        </div>
      </div>
    </div>
  )
}
