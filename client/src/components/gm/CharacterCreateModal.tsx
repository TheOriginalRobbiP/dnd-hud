import { useState } from 'react'
import type { WSMessage } from '../../types'

const EFFORT_TYPES = ['basic', 'weapon', 'magic', 'ultimate'] as const

interface Skill {
  name: string
  level: number
  effortType: typeof EFFORT_TYPES[number]
  description: string
}

interface CharacterCreateModalProps {
  onClose: () => void
  onCreated: () => void
  send: (msg: WSMessage) => void
}

export function CharacterCreateModal({ onClose, onCreated, send }: CharacterCreateModalProps) {
  const [crawlerName, setCrawlerName] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [maxHp, setMaxHp] = useState('10')
  const [maxMp, setMaxMp] = useState('0')
  const [stats, setStats] = useState({ STR: 4, DEX: 4, CON: 4, INT: 4, CHA: 4 })
  const [viewerCount, setViewerCount] = useState('1000')
  const [skills, setSkills] = useState<Skill[]>([])
  const [addingSkill, setAddingSkill] = useState(false)
  const [skillForm, setSkillForm] = useState<Skill>({ name: '', level: 1, effortType: 'basic', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const statStat = (stat: keyof typeof stats, val: string) => {
    const n = parseInt(val)
    if (!isNaN(n) && n >= 0 && n <= 20) setStats(p => ({ ...p, [stat]: n }))
  }

  const addSkill = () => {
    if (!skillForm.name.trim()) return
    setSkills(p => [...p, { ...skillForm, name: skillForm.name.trim() }])
    setSkillForm({ name: '', level: 1, effortType: 'basic', description: '' })
    setAddingSkill(false)
  }

  const submit = async () => {
    if (!crawlerName.trim() || !playerName.trim()) { setError('Crawler name and player name required.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crawlerName: crawlerName.trim(),
          playerName: playerName.trim(),
          hp: parseInt(maxHp) || 10,
          maxHp: parseInt(maxHp) || 10,
          mp: parseInt(maxMp) || 0,
          maxMp: parseInt(maxMp) || 0,
          stats: { ...stats, WIS: 4 },
          skills: skills.map(s => ({ ...s, id: crypto.randomUUID() })),
          viewerCount: parseInt(viewerCount) || 1000,
        })
      })
      if (!res.ok) throw new Error('Server error')
      // Trigger full state refresh for all clients
      send({ type: 'full_state_sync_request' } as any)
      onCreated()
      onClose()
    } catch (e) {
      setError('Failed to create character. Check server.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-hud-bg/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-hud-panel border border-hud-border w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <div className="font-hud text-hud-accent tracking-widest text-sm">REGISTER NEW CRAWLER</div>
          <button onClick={onClose} aria-label="Close" className="font-hud text-hud-muted hover:text-hp-low px-2">✕</button>
        </div>

        {/* Names */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">CRAWLER NAME</div>
            <input value={crawlerName} onChange={e => setCrawlerName(e.target.value)}
              placeholder="e.g. CARL"
              className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none uppercase" />
          </div>
          <div>
            <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">PLAYER NAME</div>
            <input value={playerName} onChange={e => setPlayerName(e.target.value)}
              placeholder="e.g. Rob"
              className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
          </div>
        </div>

        {/* HP / MP / Viewers */}
        <div className="grid grid-cols-3 gap-3">
          {[['MAX HP', maxHp, setMaxHp], ['MAX MP', maxMp, setMaxMp], ['VIEWERS', viewerCount, setViewerCount]].map(([label, val, setter]) => (
            <div key={label as string}>
              <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">{label as string}</div>
              <input value={val as string} onChange={e => (setter as any)(e.target.value)} type="number" min="0"
                className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div>
          <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">STATS (0–20)</div>
          <div className="grid grid-cols-5 gap-2">
            {(Object.keys(stats) as Array<keyof typeof stats>).map(stat => (
              <div key={stat} className="text-center">
                <div className="font-hud text-xs text-hud-muted mb-1">{stat}</div>
                <input value={stats[stat]} onChange={e => statStat(stat, e.target.value)}
                  type="number" min="0" max="20"
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 text-center focus:border-hud-accent outline-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="font-hud text-xs text-hud-muted tracking-wider">SKILLS</div>
            <button onClick={() => setAddingSkill(a => !a)}
              className="font-hud text-xs border border-hud-border text-hud-muted px-2 py-1 hover:border-hud-accent hover:text-hud-accent transition-colors">
              + ADD SKILL
            </button>
          </div>
          {skills.map((s, i) => (
            <div key={i} className="flex justify-between items-center border border-hud-border px-3 py-2 mb-1">
              <span className="font-hud text-sm text-hud-text">{s.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-hud text-xs text-hud-muted">LVL {s.level} · {s.effortType}</span>
                <button onClick={() => setSkills(p => p.filter((_, j) => j !== i))} aria-label={`Remove ${s.name}`}
                  className="font-hud text-xs text-hud-muted hover:text-hp-low px-1">✕</button>
              </div>
            </div>
          ))}
          {addingSkill && (
            <div className="border border-hud-border p-3 flex flex-col gap-2 mt-1">
              <input value={skillForm.name} onChange={e => setSkillForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Skill name..." className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
              <input value={skillForm.description} onChange={e => setSkillForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Description..." className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
              <div className="flex gap-2">
                <input value={skillForm.level} onChange={e => setSkillForm(p => ({ ...p, level: parseInt(e.target.value) || 1 }))}
                  type="number" min="1" max="15" placeholder="Level"
                  className="w-20 bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
                {EFFORT_TYPES.map(t => (
                  <button key={t} onClick={() => setSkillForm(p => ({ ...p, effortType: t }))}
                    className={`px-2 py-1 font-hud text-xs border transition-colors ${skillForm.effortType === t ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted'}`}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <button onClick={addSkill}
                className="border border-hud-accent text-hud-accent font-hud text-xs py-2 hover:bg-hud-accent hover:text-hud-bg transition-colors">
                ADD SKILL
              </button>
            </div>
          )}
        </div>

        {error && <div className="font-hud text-sm text-hp-low border border-red-900 px-3 py-2">{error}</div>}

        <button onClick={submit} disabled={saving}
          className="border border-hud-accent text-hud-accent font-hud text-sm py-3 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-wider disabled:opacity-50">
          {saving ? 'REGISTERING...' : 'REGISTER CRAWLER'}
        </button>
      </div>
    </div>
  )
}
