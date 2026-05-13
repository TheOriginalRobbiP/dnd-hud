import { useState } from 'react'
import { systemSpeak } from '../../utils/audio'
import type { WSMessage, LootBox, Character } from '../../types'
import { tierColour } from '../../utils/colours'

const ANNOUNCEMENTS = [
  { label: 'Floor Start',    audioKey: 'floor_start',    text: 'Welcome, Crawlers. The floor is open. Your audience is watching. Do try to be entertaining.' },
  { label: 'Death',          audioKey: 'death',          text: 'Oh! A crawler is down! Viewer counts are spiking. The audience LOVES this.' },
  { label: 'Achievement',    audioKey: 'achievement',    text: 'New Achievement unlocked! The System has noted your... creativity.' },
  { label: 'Sponsor Bid',    audioKey: 'sponsor_bid',    text: 'Attention Crawler: a sponsor has expressed interest. A bidding war has begun.' },
  { label: 'Floor Collapse', audioKey: 'floor_collapse', text: 'WARNING: Floor integrity at 20%. The stairwell will seal in 10 minutes. Run.' },
  { label: 'Safe Room',      audioKey: 'safe_room',      text: 'Safe Room detected. You have found a brief reprieve. The cameras are still rolling.' },
]

interface GMLogPanelProps {
  gmLog: string[]
  lootQueue: LootBox[]
  characters: Character[]
  send: (msg: WSMessage) => void
}

export function GMLogPanel({ gmLog, lootQueue, characters, send }: GMLogPanelProps) {
  const [custom, setCustom] = useState('')
  const [achieveOpen, setAchieveOpen] = useState(false)
  const [achieveCharId, setAchieveCharId] = useState('')
  const [achieveName, setAchieveName] = useState('')
  const [achieveDesc, setAchieveDesc] = useState('')
  const [achieveTier, setAchieveTier] = useState<'bronze'|'silver'|'gold'|'celestial'>('bronze')

  const fire = (label: string, text: string, audioKey?: string) => {
    const ann = ANNOUNCEMENTS.find(a => a.label === label)
    const key = audioKey || (ann as any)?.audioKey
    if (key) systemSpeak(key)
    send({ type: 'announcement', label, text })
  }

  const fireAchievement = () => {
    if (!achieveCharId || !achieveName.trim()) return
    send({
      type: 'achievement_unlock',
      charId: achieveCharId,
      achievement: {
        id: crypto.randomUUID(),
        name: achieveName.trim(),
        description: achieveDesc.trim(),
        tier: achieveTier,
        unlockedAt: Date.now(),
        isNew: true,
      }
    })
    fire('Achievement', 'New Achievement unlocked! The System has noted your... creativity.')
    setAchieveName(''); setAchieveDesc(''); setAchieveCharId(''); setAchieveOpen(false)
  }

  const pendingBoxes = lootQueue.filter(b => b.state === 'pending' || b.state === 'authorised')
  const getCharName = (id: string) => characters.find(c => c.id === id)?.crawlerName ?? '???'

  return (
    <div className="w-72 border-l border-hud-border bg-hud-panel flex flex-col overflow-hidden flex-shrink-0">

      {/* ── EVENT LOG — top, gets most space ─────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <div className="px-3 pt-3 pb-1 font-hud text-xs text-hud-muted tracking-widest sticky top-0 bg-hud-panel border-b border-hud-border">
          EVENT LOG
        </div>
        <div className="flex flex-col gap-0.5 p-2">
          {gmLog.length === 0
            ? <p className="font-hud text-sm text-hud-muted italic p-2">No events yet.</p>
            : [...gmLog].map((entry, i) => (
              <div key={i} className="font-hud text-xs text-hud-muted border-l-2 border-hud-border pl-2 py-1 leading-relaxed">
                {entry}
              </div>
            ))
          }
        </div>
      </div>

      {/* ── LOOT QUEUE — only shown when boxes pending ────── */}
      {pendingBoxes.length > 0 && (
        <div className="border-t border-hud-border p-2 flex flex-col gap-1 flex-shrink-0">
          <div className="font-hud text-xs text-hud-muted tracking-widest px-1">LOOT QUEUE</div>
          {pendingBoxes.map(b => (
            <div key={b.id} className="border border-hud-border px-2 py-1 flex items-center justify-between">
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-hud text-xs flex-shrink-0" style={{ color: tierColour(b.tier) }}>{b.tier.toUpperCase()}</span>
                <span className="font-hud text-xs text-hud-muted truncate">→ {getCharName(b.assignedTo)}</span>
              </div>
              {b.state === 'pending'
                ? <button onClick={() => send({ type: 'loot_authorise', lootBoxId: b.id })}
                    className="font-hud text-xs border px-2 py-0.5 transition-colors hover:opacity-80 flex-shrink-0"
                    style={{ borderColor: tierColour(b.tier), color: tierColour(b.tier) }}>
                    GO
                  </button>
                : <span className="font-hud text-xs text-green-400 flex-shrink-0">OPEN</span>
              }
            </div>
          ))}
        </div>
      )}

      {/* ── ANNOUNCEMENTS ─────────────────────────────────── */}
      <div className="border-t border-hud-border flex-shrink-0">
        <div className="grid grid-cols-2 gap-px bg-hud-border">
          {ANNOUNCEMENTS.map(a => (
            <button key={a.label} onClick={() => fire(a.label, a.text)}
              className="bg-hud-panel font-hud text-xs py-2 px-2 text-hud-muted hover:text-hud-accent hover:bg-hud-bg transition-colors text-left tracking-wide">
              {a.label.toUpperCase()}
            </button>
          ))}
        </div>
        {/* Custom broadcast */}
        <div className="flex gap-1 p-2 border-t border-hud-border">
          <input value={custom} onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { systemSpeak(custom.trim(), true); fire('Custom', custom.trim()); setCustom('') } }}
            placeholder="Custom announcement..."
            className="flex-1 bg-hud-bg border border-hud-border text-hud-text font-hud text-xs px-2 py-1 focus:border-hud-accent outline-none min-w-0" />
          <button onClick={() => { if (custom.trim()) { systemSpeak(custom.trim(), true); fire('Custom', custom.trim()); setCustom('') } }}
            className="border border-hud-accent text-hud-accent font-hud text-xs px-2 hover:bg-hud-accent hover:text-hud-bg transition-colors flex-shrink-0">
            ▶
          </button>
        </div>
      </div>

      {/* ── ACHIEVEMENT — collapsible at bottom ───────────── */}
      <div className="border-t border-hud-border flex-shrink-0">
        <button onClick={() => setAchieveOpen(o => !o)}
          className="w-full flex justify-between items-center px-3 py-2 font-hud text-xs text-hud-muted hover:text-hud-accent transition-colors tracking-widest">
          <span>UNLOCK ACHIEVEMENT</span>
          <span>{achieveOpen ? '▲' : '▼'}</span>
        </button>
        {achieveOpen && (
          <div className="px-3 pb-3 flex flex-col gap-2 border-t border-hud-border">
            <select value={achieveCharId} onChange={e => setAchieveCharId(e.target.value)}
              className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1.5 focus:border-hud-accent outline-none mt-2">
              <option value="">Select crawler...</option>
              {characters.map(c => <option key={c.id} value={c.id}>{c.crawlerName}</option>)}
            </select>
            <input value={achieveName} onChange={e => setAchieveName(e.target.value)}
              placeholder="Achievement name..."
              className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1.5 focus:border-hud-accent outline-none" />
            <input value={achieveDesc} onChange={e => setAchieveDesc(e.target.value)}
              placeholder="Description..."
              className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-1.5 focus:border-hud-accent outline-none" />
            <div className="flex gap-1">
              {(['bronze','silver','gold','celestial'] as const).map(t => (
                <button key={t} onClick={() => setAchieveTier(t)}
                  className="flex-1 font-hud text-xs py-1 border transition-colors"
                  style={{ borderColor: achieveTier === t ? `var(--tier-${t})` : undefined, color: achieveTier === t ? `var(--tier-${t})` : undefined }}>
                  {t[0].toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={fireAchievement}
              className="border border-hud-accent text-hud-accent font-hud text-xs py-1.5 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-wider">
              UNLOCK
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
