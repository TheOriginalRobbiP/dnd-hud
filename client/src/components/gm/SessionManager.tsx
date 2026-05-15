import { useState, useEffect } from 'react'
import type { WSMessage } from '../../types'

interface Snapshot {
  id: string
  name: string
  createdAt: string
}

interface SessionManagerProps {
  send: (msg: WSMessage) => void
  onClose: () => void
}

export function SessionManager({ send, onClose }: SessionManagerProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmLoad, setConfirmLoad] = useState<Snapshot | null>(null)

  const fetchSnaps = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/session/snapshots')
      setSnapshots(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSnaps() }, [])

  const saveSnapshot = () => {
    const name = newName.trim()
    if (!name) return
    send({ type: 'session_snapshot_save', name })
    setNewName('')
    // Refetch after a short delay to pick up the new row
    setTimeout(fetchSnaps, 800)
  }

  const loadSnapshot = (snap: Snapshot) => {
    send({ type: 'session_snapshot_load', snapshotId: snap.id })
    setConfirmLoad(null)
    onClose()
  }

  const deleteSnapshot = async (id: string) => {
    await fetch(`/api/session/snapshots/${id}`, { method: 'DELETE' })
    setSnapshots(s => s.filter(x => x.id !== id))
  }

  const doReset = () => {
    send({ type: 'session_reset' })
    setConfirmReset(false)
    onClose()
  }

  const fmt = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 bg-hud-bg/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-hud-panel border border-hud-border w-full max-w-md p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="font-hud text-hud-accent tracking-widest text-sm">SESSION MANAGER</div>
          <button onClick={onClose} className="font-hud text-hud-muted hover:text-hp-low px-2">✕</button>
        </div>

        {/* ── RESET ────────────────────────────────────────── */}
        <div className="border border-hud-border p-3 flex flex-col gap-2">
          <div className="font-hud text-xs text-hud-muted tracking-wider">RESET SESSION</div>
          <p className="font-hud text-xs text-hud-muted italic">
            Restores all crawlers to full HP/MP, clears status effects, removes active mobs,
            clears pending loot boxes, resets room to 1. Does NOT wipe inventory or achievements.
          </p>
          {!confirmReset
            ? <button onClick={() => setConfirmReset(true)}
                className="border border-hp-low text-hp-low font-hud text-sm py-2 hover:bg-red-950 transition-colors tracking-wider">
                RESET SESSION
              </button>
            : <div className="flex gap-2">
                <button onClick={doReset}
                  className="flex-1 border border-hp-low text-hp-low font-hud text-sm py-2 bg-red-950 tracking-wider">
                  CONFIRM RESET
                </button>
                <button onClick={() => setConfirmReset(false)}
                  className="border border-hud-border text-hud-muted font-hud text-sm px-4 hover:border-hud-accent transition-colors">
                  CANCEL
                </button>
              </div>
          }
        </div>

        {/* ── SAVE SNAPSHOT ────────────────────────────────── */}
        <div className="border border-hud-border p-3 flex flex-col gap-2">
          <div className="font-hud text-xs text-hud-muted tracking-wider">SAVE SNAPSHOT</div>
          <p className="font-hud text-xs text-hud-muted italic">
            Saves current HP, inventory, status effects, and floor state as a named restore point.
          </p>
          <div className="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveSnapshot()}
              placeholder='e.g. "Pre-Floor 2"'
              className="flex-1 bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
            <button onClick={saveSnapshot} disabled={!newName.trim()}
              className="border border-hud-accent text-hud-accent font-hud text-sm px-3 hover:bg-hud-accent hover:text-hud-bg transition-colors disabled:opacity-40">
              SAVE
            </button>
          </div>
        </div>

        {/* ── SNAPSHOTS LIST ───────────────────────────────── */}
        <div className="flex flex-col gap-1">
          <div className="font-hud text-xs text-hud-muted tracking-wider">SAVED SNAPSHOTS</div>
          {loading && <div className="font-hud text-sm text-hud-muted animate-pulse p-2">Loading...</div>}
          {!loading && snapshots.length === 0 && (
            <div className="font-hud text-sm text-hud-muted italic p-2">No snapshots yet.</div>
          )}
          {!loading && snapshots.map(snap => (
            <div key={snap.id} className="border border-hud-border px-3 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-hud text-sm text-hud-text truncate">{snap.name}</div>
                <div className="font-hud text-xs text-hud-muted">{fmt(snap.createdAt)}</div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {confirmLoad?.id === snap.id
                  ? <>
                      <button onClick={() => loadSnapshot(snap)}
                        className="font-hud text-xs border border-hud-accent text-hud-accent px-2 py-1 hover:bg-hud-accent hover:text-hud-bg transition-colors">
                        CONFIRM
                      </button>
                      <button onClick={() => setConfirmLoad(null)}
                        className="font-hud text-xs border border-hud-border text-hud-muted px-2 py-1">
                        ✕
                      </button>
                    </>
                  : <>
                      <button onClick={() => setConfirmLoad(snap)}
                        className="font-hud text-xs border border-hud-border text-hud-muted px-2 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors">
                        RESTORE
                      </button>
                      <button onClick={() => deleteSnapshot(snap.id)}
                        className="font-hud text-xs border border-hud-border text-hud-muted px-2 py-1 hover:border-hp-low hover:text-hp-low transition-colors">
                        ✕
                      </button>
                    </>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
