import { useState } from 'react'
import type { WSMessage, LootBox, Character } from '../../types'

const ANNOUNCEMENTS = [
  { label: 'Floor Start', text: 'Welcome, Crawlers. The floor is open. Your audience is watching. Do try to be entertaining.' },
  { label: 'Death', text: 'Oh! A crawler is down! Viewer counts are spiking. The audience LOVES this.' },
  { label: 'Achievement', text: 'New Achievement unlocked! The System has noted your... creativity.' },
  { label: 'Sponsor Bid', text: 'Attention Crawler: a sponsor has expressed interest. A bidding war has begun.' },
  { label: 'Floor Collapse', text: 'WARNING: Floor integrity at 20%. The stairwell will seal in 10 minutes. Run.' },
  { label: 'Safe Room', text: 'Safe Room detected. You have found a brief reprieve. The cameras are still rolling.' },
]

import { tierColour } from '../../utils/colours'

interface GMLogPanelProps {
  gmLog: string[]
  lootQueue: LootBox[]
  characters: Character[]
  send: (msg: WSMessage) => void
}

export function GMLogPanel({ gmLog, lootQueue, characters, send }: GMLogPanelProps) {
  const [custom, setCustom] = useState('')
  const [achieveCharId, setAchieveCharId] = useState('')
  const [achieveName, setAchieveName] = useState('')
  const [achieveDesc, setAchieveDesc] = useState('')
  const [achieveTier, setAchieveTier] = useState<'bronze'|'silver'|'gold'|'celestial'>('bronze')

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
    fire('Achievement', `New Achievement unlocked! The System has noted your... creativity.`)
    setAchieveName(''); setAchieveDesc(''); setAchieveCharId('')
  }
  const pendingBoxes = lootQueue.filter(b => b.state === 'pending' || b.state === 'authorised')

  const fire = (label: string, text: string) => send({ type: 'announcement', label, text })
  const getCharName = (id: string) => characters.find(c => c.id === id)?.crawlerName ?? '???'

  return (
    <div className="w-72 border-l border-hud-border bg-hud-panel flex flex-col overflow-hidden">
      <div className="p-3 border-b border-hud-border">
        <div className="font-hud text-sm text-hud-muted tracking-widest">GM CONSOLE</div>
      </div>

      {/* Loot queue */}
      {pendingBoxes.length > 0 && (
        <div className="p-3 border-b border-hud-border flex flex-col gap-2">
          <div className="font-hud text-sm text-hud-muted tracking-widest">LOOT QUEUE</div>
          {pendingBoxes.map(b => (
            <div key={b.id} className="border border-hud-border p-2 flex items-center justify-between">
              <div>
                <span className="font-hud text-sm" style={{ color: tierColour(b.tier) }}>{b.tier.toUpperCase()}</span>
                <span className="font-hud text-sm text-hud-muted ml-2">→ {getCharName(b.assignedTo)}</span>
              </div>
              {b.state === 'pending'
                ? <button onClick={() => send({ type: 'loot_authorise', lootBoxId: b.id })}
                    className="font-hud text-sm border px-2 py-0.5 transition-colors hover:text-green-400"
                    style={{ borderColor: tierColour(b.tier), color: tierColour(b.tier) }}>
                    AUTHORISE
                  </button>
                : <span className="font-hud text-sm text-green-400">AUTHORISED</span>
              }
            </div>
          ))}
        </div>
      )}


      {/* Achievement unlock */}
      <div className="p-3 border-b border-hud-border flex flex-col gap-2">
        <div className="font-hud text-sm text-hud-muted tracking-widest">UNLOCK ACHIEVEMENT</div>
        <select value={achieveCharId} onChange={e => setAchieveCharId(e.target.value)}
          className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none">
          <option value="">Select crawler...</option>
          {characters.map(c => <option key={c.id} value={c.id}>{c.crawlerName}</option>)}
        </select>
        <input value={achieveName} onChange={e => setAchieveName(e.target.value)}
          placeholder="Achievement name..."
          className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
        <input value={achieveDesc} onChange={e => setAchieveDesc(e.target.value)}
          placeholder="Description..."
          className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
        <div className="flex gap-1">
          {(['bronze','silver','gold','celestial'] as const).map(t => (
            <button key={t} onClick={() => setAchieveTier(t)}
              className="flex-1 font-hud text-xs py-1 border transition-colors"
              style={{ borderColor: achieveTier === t ? `var(--tier-${t})` : undefined, color: achieveTier === t ? `var(--tier-${t})` : undefined }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={fireAchievement}
          className="border border-hud-accent text-hud-accent font-hud text-xs py-2 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-wider">
          UNLOCK
        </button>
      </div>

      {/* Announcement buttons */}
      <div className="p-3 flex flex-col gap-1 border-b border-hud-border">
        <div className="font-hud text-sm text-hud-muted tracking-widest mb-1">ANNOUNCEMENTS</div>
        {ANNOUNCEMENTS.map(a => (
          <button key={a.label} onClick={() => fire(a.label, a.text)}
            className="border border-hud-border text-hud-muted font-hud text-sm py-2 px-3 text-left hover:border-hud-accent hover:text-hud-accent transition-colors tracking-wide">
            {a.label.toUpperCase()}
          </button>
        ))}
        <textarea value={custom} onChange={e => setCustom(e.target.value)} rows={2}
          placeholder="Custom announcement..."
          className="mt-1 w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none resize-none" />
        <button onClick={() => { if (custom.trim()) { fire('Custom', custom.trim()); setCustom('') } }}
          className="border border-hud-accent text-hud-accent font-hud text-sm py-1 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-wider">
          BROADCAST
        </button>
      </div>

      {/* Event feed */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        <div className="font-hud text-sm text-hud-muted tracking-widest mb-1">EVENT LOG</div>
        {gmLog.length === 0
          ? <p className="font-hud text-sm text-hud-muted italic">No events yet.</p>
          : [...gmLog].map((entry, i) => (
            <div key={i} className="font-hud text-sm text-hud-muted border-l border-hud-border pl-2 py-0.5">{entry}</div>
          ))
        }
      </div>
    </div>
  )
}
