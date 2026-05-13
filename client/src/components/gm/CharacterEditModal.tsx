import { useState } from 'react'
import type { Character, WSMessage } from '../../types'

const EFFORT_TYPES = ['basic', 'weapon', 'magic', 'ultimate'] as const

interface CharacterEditModalProps {
  character: Character
  onClose: () => void
  send: (msg: WSMessage) => void
}

export function CharacterEditModal({ character, onClose, send }: CharacterEditModalProps) {
  const [tab, setTab] = useState<'stats' | 'class' | 'skills' | 'viewers'>('stats')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Stats
  const [stats, setStats] = useState({ ...character.stats as any })
  const [hp, setHp] = useState(String(character.maxHp))
  const [mp, setMp] = useState(String(character.maxMp))
  const [notes, setNotes] = useState(character.notes)

  // Class/Race
  const [charClass, setCharClass] = useState(character.class ?? '')
  const [charRace, setCharRace] = useState(character.race ?? '')
  const [classLocked, setClassLocked] = useState(!character.class)

  // Skills
  const [skills, setSkills] = useState<any[]>([...character.skills as any[]])
  const [addingSkill, setAddingSkill] = useState(false)
  const [skillForm, setSkillForm] = useState({ name: '', level: 1, effortType: 'basic' as typeof EFFORT_TYPES[number], description: '' })

  // Viewers
  const [viewerCount, setViewerCount] = useState(String(character.viewerCount))

  const save = async (patch: object) => {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      })
      if (!res.ok) throw new Error('Server error')
      send({ type: 'full_state_sync_request' } as any)
    } catch {
      setError('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const saveStats = () => save({
    stats: { ...stats, WIS: stats.WIS ?? 4 },
    maxHp: parseInt(hp) || character.maxHp,
    hp: Math.min(character.hp, parseInt(hp) || character.maxHp),
    maxMp: parseInt(mp) || character.maxMp,
    notes,
  })

  const saveClass = () => save({
    class: charClass.trim() || null,
    race: charRace.trim() || null,
  })

  const saveSkills = () => save({ skills })

  const saveViewers = () => {
    const v = parseInt(viewerCount)
    if (!isNaN(v) && v >= 0) {
      send({ type: 'viewer_update', charId: character.id, viewerCount: v })
    }
  }

  const addSkill = () => {
    if (!skillForm.name.trim()) return
    setSkills(p => [...p, { ...skillForm, id: crypto.randomUUID(), name: skillForm.name.trim() }])
    setSkillForm({ name: '', level: 1, effortType: 'basic', description: '' })
    setAddingSkill(false)
  }

  const TABS = [
    { id: 'stats', label: 'STATS' },
    { id: 'class', label: 'CLASS' },
    { id: 'skills', label: 'SKILLS' },
    { id: 'viewers', label: 'VIEWERS' },
  ] as const

  return (
    <div className="fixed inset-0 bg-hud-bg/90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-hud-panel border border-hud-border w-full max-w-lg flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-hud-border">
          <div className="font-hud text-hud-accent tracking-widest text-sm">
            EDIT — {character.crawlerName.toUpperCase()}
          </div>
          <button onClick={onClose} aria-label="Close" className="font-hud text-hud-muted hover:text-hp-low px-2">✕</button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-hud-border">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 font-hud text-xs py-2 tracking-widest transition-colors border-b-2 ${
                tab === t.id ? 'text-hud-accent border-hud-accent' : 'text-hud-muted border-transparent hover:text-hud-text'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

          {tab === 'stats' && <>
            <div className="grid grid-cols-2 gap-3">
              {[['MAX HP', hp, setHp], ['MAX MP', mp, setMp]].map(([label, val, setter]) => (
                <div key={label as string}>
                  <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">{label as string}</div>
                  <input value={val as string} onChange={e => (setter as any)(e.target.value)} type="number" min="0"
                    className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
                </div>
              ))}
            </div>
            <div>
              <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">ABILITY SCORES</div>
              <div className="grid grid-cols-5 gap-2">
                {['STR','DEX','CON','INT','CHA'].map(s => (
                  <div key={s} className="text-center">
                    <div className="font-hud text-xs text-hud-muted mb-1">{s}</div>
                    <input value={stats[s] ?? 4} onChange={e => setStats((p: any) => ({ ...p, [s]: parseInt(e.target.value) || 0 }))}
                      type="number" min="0" max="100"
                      className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 text-center focus:border-hud-accent outline-none" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">GM NOTES</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none resize-none" />
            </div>
            <button onClick={saveStats} disabled={saving}
              className="border border-hud-accent text-hud-accent font-hud text-sm py-3 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-wider disabled:opacity-50">
              {saving ? 'SAVING...' : 'SAVE STATS'}
            </button>
          </>}

          {tab === 'class' && <>
            <div className="border border-hud-border p-3 flex items-start gap-3">
              <div className="flex-1">
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">STATUS</div>
                <div className="font-hud text-sm text-hud-text">
                  {character.class ? `Class and race unlocked.` : `Locked — unlocks Floor 3.`}
                </div>
              </div>
              <button
                onClick={() => setClassLocked(l => !l)}
                className={`font-hud text-xs border px-3 py-1 transition-colors ${
                  classLocked ? 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent' : 'border-green-800 text-green-400'
                }`}>
                {classLocked ? '🔒 OVERRIDE' : '🔓 UNLOCKED'}
              </button>
            </div>
            {!classLocked && <>
              <div>
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">CLASS</div>
                <input value={charClass} onChange={e => setCharClass(e.target.value)}
                  placeholder="e.g. Dungeon Runner, Infiltrator..."
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
              </div>
              <div>
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">RACE</div>
                <input value={charRace} onChange={e => setCharRace(e.target.value)}
                  placeholder="e.g. Human, Dwarf, Caterpillar..."
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
              </div>
              <button onClick={saveClass} disabled={saving}
                className="border border-hud-accent text-hud-accent font-hud text-sm py-3 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-wider disabled:opacity-50">
                {saving ? 'SAVING...' : 'SAVE CLASS & RACE'}
              </button>
            </>}
          </>}

          {tab === 'skills' && <>
            <div className="flex flex-col gap-2">
              {skills.map((s: any, i: number) => (
                <div key={s.id ?? i} className="border border-hud-border p-3 flex items-center justify-between">
                  <div>
                    <div className="font-hud text-sm text-hud-text">{s.name}</div>
                    <div className="font-hud text-xs text-hud-muted mt-0.5">LVL {s.level} · {s.effortType}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input value={s.level} type="number" min="1" max="20"
                      onChange={e => setSkills(p => p.map((sk: any, j: number) => j === i ? { ...sk, level: parseInt(e.target.value) || 1 } : sk))}
                      className="w-14 bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-1 text-center focus:border-hud-accent outline-none" />
                    <button onClick={() => setSkills(p => p.filter((_: any, j: number) => j !== i))}
                      aria-label={`Remove ${s.name}`}
                      className="font-hud text-sm text-hud-muted hover:text-hp-low px-1">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setAddingSkill(a => !a)}
              className="border border-hud-border text-hud-muted font-hud text-xs px-3 py-2 hover:border-hud-accent hover:text-hud-accent transition-colors">
              + ADD SKILL
            </button>
            {addingSkill && (
              <div className="border border-hud-border p-3 flex flex-col gap-2">
                <input value={skillForm.name} onChange={e => setSkillForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Skill name..."
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
                <input value={skillForm.description} onChange={e => setSkillForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description..."
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none" />
                <div className="flex gap-2">
                  <input value={skillForm.level} type="number" min="1" max="20"
                    onChange={e => setSkillForm(p => ({ ...p, level: parseInt(e.target.value) || 1 }))}
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
                  ADD
                </button>
              </div>
            )}
            <button onClick={saveSkills} disabled={saving}
              className="border border-hud-accent text-hud-accent font-hud text-sm py-3 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-wider disabled:opacity-50">
              {saving ? 'SAVING...' : 'SAVE SKILLS'}
            </button>
          </>}

          {tab === 'viewers' && <>
            <div className="border border-hud-border p-4">
              <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">LIVE VIEWER COUNT</div>
              <div className="font-hud text-4xl text-hud-accent mb-3">{character.viewerCount.toLocaleString()}</div>
              <input value={viewerCount} onChange={e => setViewerCount(e.target.value)} type="number" min="0"
                className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none mb-3" />
              <button onClick={saveViewers} disabled={saving}
                className="w-full border border-hud-accent text-hud-accent font-hud text-sm py-3 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-wider disabled:opacity-50">
                {saving ? 'UPDATING...' : 'SET VIEWER COUNT'}
              </button>
            </div>
            <p className="font-hud text-xs text-hud-muted italic">
              The audience is always watching. This number is displayed prominently on the crawler's Fame tab.
            </p>
          </>}

          {error && <div className="font-hud text-sm text-hp-low border border-red-900 px-3 py-2">{error}</div>}
        </div>
      </div>
    </div>
  )
}
