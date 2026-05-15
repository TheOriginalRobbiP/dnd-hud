import { useState } from 'react'
import {
  STAT_ARRAY, COMBAT_SKILLS, YOUTH_BACKGROUNDS, TRAINING_BACKGROUNDS,
  ADULT_BACKGROUNDS, QUIRK_BACKGROUNDS, calcEvade, calcMaxHp, calcMaxMp, calcMove, statMod
} from '../../data/characterCreation'

// ── Types ────────────────────────────────────────────────────
interface WizardSkill {
  name: string
  level: number
  effortType: 'basic' | 'weapon' | 'magic'
  description: string
}

interface WizardState {
  // Screen 1 — Identity
  crawlerName: string
  playerName: string
  pronouns: string
  preJob: string
  crawlerNumber: string
  // Screen 2 — Backgrounds
  youthBg: number | null       // index into YOUTH_BACKGROUNDS
  youthSkills: [string, string] // two chosen skills
  trainingBg: number | null
  trainingSkills: [string, string]
  adultBg: number | null
  adultSkills: [string, string]
  quirkyBg: number | null
  quirkySkills: [string, string]
  // Screen 3 — Combat
  combatSkillIdx: number | null
  combatSkill2Idx: number | null // unarmed (always Unarmed Combat at rank 3)
  // Screen 4 — Stats
  statAssignments: { STR: number | null; DEX: number | null; CON: number | null; INT: number | null; CHA: number | null }
  // Screen 5 — Backstory
  pastTrauma: string
  looseEnd: string
  regrets: string
  // Screen 6 — Review (no extra data)
}

const SCREENS = ['IDENTITY', 'BACKGROUNDS', 'COMBAT', 'STATS', 'BACKSTORY', 'REVIEW'] as const

interface CrawlerWizardProps {
  onClose: () => void
  onComplete: (character: any) => void
}

const INITIAL: WizardState = {
  crawlerName: '', playerName: '', pronouns: '', preJob: '', crawlerNumber: '',
  youthBg: null, youthSkills: ['', ''],
  trainingBg: null, trainingSkills: ['', ''],
  adultBg: null, adultSkills: ['', ''],
  quirkyBg: null, quirkySkills: ['', ''],
  combatSkillIdx: null, combatSkill2Idx: null,
  statAssignments: { STR: null, DEX: null, CON: null, INT: null, CHA: null },
  pastTrauma: '', looseEnd: '', regrets: '',
}

// ── Helpers ──────────────────────────────────────────────────
function StatPip({ value }: { value: number | null }) {
  return (
    <span className={`font-hud text-lg ${value !== null ? 'text-hud-accent' : 'text-hud-muted'}`}>
      {value ?? '—'}
    </span>
  )
}

function rollD6() { return Math.floor(Math.random() * 6) + 1 }

function ScreenHeader({ title, step, total }: { title: string; step: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="flex gap-1 mb-3">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 ${i < step ? 'bg-hud-accent' : 'bg-hud-border'}`} />
        ))}
      </div>
      <div className="font-hud text-hud-accent tracking-widest text-sm">{title}</div>
    </div>
  )
}

// ── Background Picker ─────────────────────────────────────────
function BgPicker({
  label, table, selected, onSelect, chosenSkills, onSkillToggle
}: {
  label: string
  table: typeof YOUTH_BACKGROUNDS
  selected: number | null
  onSelect: (i: number) => void
  chosenSkills: [string, string]
  onSkillToggle: (skill: string) => void
}) {
  const bg = selected !== null ? table[selected] : null
  return (
    <div className="border border-hud-border p-3 mb-3">
      <div className="font-hud text-xs text-hud-muted tracking-wider mb-2 flex justify-between items-center">
        <span>{label}</span>
        <button
          onClick={() => onSelect(rollD6() - 1)}
          className="text-xs border border-hud-border text-hud-muted px-2 py-0.5 hover:border-hud-accent hover:text-hud-accent transition-colors"
        >
          ROLL d6
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1 mb-2">
        {table.map((b, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`font-hud text-xs py-1.5 px-2 border transition-colors ${selected === i ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'}`}
          >
            {i + 1}. {b.name}
          </button>
        ))}
      </div>
      {bg && (
        <div>
          <div className="font-hud text-xs text-hud-muted mb-1">CHOOSE 2 SKILLS:</div>
          <div className="flex flex-wrap gap-1">
            {bg.skills.map(s => (
              <button
                key={s}
                onClick={() => onSkillToggle(s)}
                className={`font-hud text-xs py-1 px-2 border transition-colors ${chosenSkills.includes(s) ? 'border-hud-accent text-hud-accent bg-hud-accent/10' : 'border-hud-border text-hud-muted hover:border-hud-accent'}`}
              >
                {s}
              </button>
            ))}
          </div>
          {chosenSkills.filter(Boolean).length < 2 && (
            <div className="font-hud text-xs text-hud-muted mt-1 opacity-60">
              Select {2 - chosenSkills.filter(Boolean).length} more
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Wizard ──────────────────────────────────────────────
export function CrawlerWizard({ onClose, onComplete }: CrawlerWizardProps) {
  const [screenIdx, setScreenIdx] = useState(0)
  const [wizard, setWizard] = useState<WizardState>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const screen = SCREENS[screenIdx]
  const update = (patch: Partial<WizardState>) => setWizard(p => ({ ...p, ...patch }))

  // Stat assignment helpers
  const assignedValues = Object.values(wizard.statAssignments).filter(v => v !== null) as number[]
  const availableValues = STAT_ARRAY.filter(v => !assignedValues.includes(v))

  const assignStat = (stat: keyof typeof wizard.statAssignments, val: number | null) => {
    update({ statAssignments: { ...wizard.statAssignments, [stat]: val } })
  }

  // Derived stats for review
  const stats = wizard.statAssignments
  const str = stats.STR ?? 4
  const dex = stats.DEX ?? 4
  const con = stats.CON ?? 4
  const int_ = stats.INT ?? 4
  const cha = stats.CHA ?? 4
  const maxHp = calcMaxHp(con)
  const maxMp = calcMaxMp(int_)
  const evade = calcEvade(dex)
  const move = calcMove(dex)

  // Collect all background skills
  const allBgSkills = (): WizardSkill[] => {
    const skills: WizardSkill[] = []
    const addBgSkills = (chosen: [string, string], level: number) => {
      chosen.filter(Boolean).forEach(name => {
        if (!skills.find(s => s.name === name)) {
          skills.push({ name, level, effortType: 'basic', description: '' })
        }
      })
    }
    addBgSkills(wizard.youthSkills, 1)
    addBgSkills(wizard.trainingSkills, 1)
    addBgSkills(wizard.adultSkills, 3)
    addBgSkills(wizard.quirkySkills, 2)
    return skills
  }

  // Combat skills
  const combatSkills = (): WizardSkill[] => {
    const skills: WizardSkill[] = [
      { name: 'Unarmed Combat', level: 3, effortType: 'weapon', description: 'Basic hand-to-hand. Everyone starts with this.' }
    ]
    if (wizard.combatSkillIdx !== null) {
      const cs = COMBAT_SKILLS[wizard.combatSkillIdx]
      skills.push({ name: cs.name, level: 3, effortType: cs.effortType, description: cs.description })
    }
    return skills
  }

  // Validate current screen
  const canAdvance = (): boolean => {
    switch (screen) {
      case 'IDENTITY': return wizard.crawlerName.trim().length > 0 && wizard.playerName.trim().length > 0
      case 'BACKGROUNDS':
        return wizard.youthSkills.filter(Boolean).length === 2 &&
          wizard.trainingSkills.filter(Boolean).length === 2 &&
          wizard.adultSkills.filter(Boolean).length === 2 &&
          wizard.quirkySkills.filter(Boolean).length === 2
      case 'COMBAT': return wizard.combatSkillIdx !== null
      case 'STATS': return Object.values(wizard.statAssignments).every(v => v !== null)
      case 'BACKSTORY': return true
      default: return true
    }
  }

  const handleBgSkillToggle = (
    field: 'youthSkills' | 'trainingSkills' | 'adultSkills' | 'quirkySkills',
    skill: string
  ) => {
    const current = wizard[field] as [string, string]
    if (current.includes(skill)) {
      const next = current.map(s => s === skill ? '' : s) as [string, string]
      update({ [field]: next })
    } else {
      const emptyIdx = current.findIndex(s => s === '')
      if (emptyIdx === -1) return // already have 2
      const next = [...current] as [string, string]
      next[emptyIdx] = skill
      update({ [field]: next })
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      const skills = [...allBgSkills(), ...combatSkills()]
        .map(s => ({ ...s, id: crypto.randomUUID() }))

      const body = {
        crawlerName: wizard.crawlerName.trim().toUpperCase(),
        playerName: wizard.playerName.trim(),
        hp: maxHp, maxHp,
        mp: maxMp, maxMp,
        stats: { STR: str, DEX: dex, CON: con, INT: int_, CHA: cha, WIS: 4 },
        skills,
        viewerCount: 500,
        notes: [
          wizard.preJob && `Pre-dungeon: ${wizard.preJob}`,
          wizard.pastTrauma && `Past trauma: ${wizard.pastTrauma}`,
          wizard.looseEnd && `Loose end: ${wizard.looseEnd}`,
          wizard.regrets && `Regrets: ${wizard.regrets}`,
          wizard.crawlerNumber && `Crawler #${wizard.crawlerNumber}`,
        ].filter(Boolean).join('\n'),
      }

      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Server error')
      const created = await res.json()
      onComplete(created)
    } catch {
      setError('Failed to register crawler. Check server.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-hud-bg flex flex-col overflow-hidden z-50">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 font-hud text-hud-muted hover:text-hp-low text-sm z-10"
      >
        ✕ ABORT
      </button>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">

        {/* ── IDENTITY ─────────────────────────────────────── */}
        {screen === 'IDENTITY' && (
          <div>
            <ScreenHeader title="STEP 1 — IDENTITY" step={1} total={6} />
            <p className="font-hud text-hud-muted text-sm mb-6 italic">
              "Before entering the World Dungeon, you were someone. That life is gone now — but every part of it follows you down."
            </p>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">CRAWLER NAME *</div>
                  <input
                    value={wizard.crawlerName}
                    onChange={e => update({ crawlerName: e.target.value })}
                    placeholder="e.g. CARL"
                    className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none uppercase"
                  />
                </div>
                <div>
                  <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">PLAYER NAME *</div>
                  <input
                    value={wizard.playerName}
                    onChange={e => update({ playerName: e.target.value })}
                    placeholder="e.g. Rob"
                    className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">PRONOUNS</div>
                  <input
                    value={wizard.pronouns}
                    onChange={e => update({ pronouns: e.target.value })}
                    placeholder="e.g. She/Her"
                    className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
                  />
                </div>
                <div>
                  <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">CRAWLER NUMBER</div>
                  <input
                    value={wizard.crawlerNumber}
                    onChange={e => update({ crawlerNumber: e.target.value })}
                    placeholder="500000–12900000"
                    type="number"
                    className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">YOUR JOB / LIFE BEFORE THE DUNGEON</div>
                <input
                  value={wizard.preJob}
                  onChange={e => update({ preJob: e.target.value })}
                  placeholder="e.g. Retired bingo hall manager from Wolverhampton"
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none"
                />
                <div className="font-hud text-xs text-hud-muted mt-1 opacity-60">
                  This flavours your background skills in the next step.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BACKGROUNDS ──────────────────────────────────── */}
        {screen === 'BACKGROUNDS' && (
          <div>
            <ScreenHeader title="STEP 2 — BACKGROUNDS" step={2} total={6} />
            <p className="font-hud text-hud-muted text-sm mb-4 italic">
              "Skills represent activities and talents you've trained or enhanced. The list is nearly endless — Internet Memes is a Skill."
            </p>
            <p className="font-hud text-xs text-hud-muted mb-6">
              Choose or roll for each background. Select 2 skills from each. Your pre-dungeon job should guide your choices.
            </p>

            <BgPicker
              label="YOUTH (Rank 1)"
              table={YOUTH_BACKGROUNDS}
              selected={wizard.youthBg}
              onSelect={i => { update({ youthBg: i, youthSkills: ['', ''] }) }}
              chosenSkills={wizard.youthSkills}
              onSkillToggle={s => handleBgSkillToggle('youthSkills', s)}
            />
            <BgPicker
              label="TRAINING (Rank 1)"
              table={TRAINING_BACKGROUNDS}
              selected={wizard.trainingBg}
              onSelect={i => { update({ trainingBg: i, trainingSkills: ['', ''] }) }}
              chosenSkills={wizard.trainingSkills}
              onSkillToggle={s => handleBgSkillToggle('trainingSkills', s)}
            />
            <BgPicker
              label="ADULT LIFE (Rank 3)"
              table={ADULT_BACKGROUNDS}
              selected={wizard.adultBg}
              onSelect={i => { update({ adultBg: i, adultSkills: ['', ''] }) }}
              chosenSkills={wizard.adultSkills}
              onSkillToggle={s => handleBgSkillToggle('adultSkills', s)}
            />
            <BgPicker
              label="QUIRK (Rank 2)"
              table={QUIRK_BACKGROUNDS}
              selected={wizard.quirkyBg}
              onSelect={i => { update({ quirkyBg: i, quirkySkills: ['', ''] }) }}
              chosenSkills={wizard.quirkySkills}
              onSkillToggle={s => handleBgSkillToggle('quirkySkills', s)}
            />
          </div>
        )}

        {/* ── COMBAT ───────────────────────────────────────── */}
        {screen === 'COMBAT' && (
          <div>
            <ScreenHeader title="STEP 3 — COMBAT SKILL" step={3} total={6} />
            <p className="font-hud text-hud-muted text-sm mb-2 italic">
              "Everyone enters with Unarmed Combat at Rank 3. Now pick how you'll murder for the entertainment of the masses."
            </p>
            <p className="font-hud text-xs text-hud-muted mb-6">
              Spell skills require INT 4+. Choosing a spell gives you 5 Standard Mana Potions.
            </p>

            {['Bashing', 'Edged', 'Ranged', 'Reach', 'Hand-to-Hand', 'Animal', 'Spell'].map(type => {
              const typeSkills = COMBAT_SKILLS.filter(s => s.type === type)
              return (
                <div key={type} className="mb-4">
                  <div className="font-hud text-xs text-hud-muted tracking-wider mb-2 border-b border-hud-border pb-1">
                    {type.toUpperCase()} WEAPONS
                  </div>
                  <div className="flex flex-col gap-1">
                    {typeSkills.map((cs, i) => {
                      const idx = COMBAT_SKILLS.indexOf(cs)
                      const selected = wizard.combatSkillIdx === idx
                      return (
                        <button
                          key={i}
                          onClick={() => update({ combatSkillIdx: idx })}
                          className={`text-left px-3 py-2 border font-hud transition-colors ${selected ? 'border-hud-accent bg-hud-accent/10' : 'border-hud-border hover:border-hud-accent'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-sm ${selected ? 'text-hud-accent' : 'text-hud-text'}`}>{cs.name}</span>
                            <span className="text-xs text-hud-muted">{cs.damage}</span>
                          </div>
                          <div className="text-xs text-hud-muted mt-0.5">{cs.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── STATS ────────────────────────────────────────── */}
        {screen === 'STATS' && (
          <div>
            <ScreenHeader title="STEP 4 — ASSIGN STATS" step={4} total={6} />
            <p className="font-hud text-hud-muted text-sm mb-2 italic">
              "You can be reduced to a number. Or a few numbers, all of which round down to zero in the infinite expanse of the universe."
            </p>
            <p className="font-hud text-xs text-hud-muted mb-6">
              Standard array: assign 2, 3, 4, 5, and 6 — one to each stat.
            </p>

            {/* Available pool */}
            <div className="mb-6">
              <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">AVAILABLE</div>
              <div className="flex gap-2">
                {STAT_ARRAY.map(val => {
                  const used = assignedValues.includes(val)
                  return (
                    <div key={val} className={`w-12 h-12 border font-hud text-lg flex items-center justify-center transition-colors ${used ? 'border-hud-border text-hud-muted opacity-30' : 'border-hud-accent text-hud-accent'}`}>
                      {val}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stat assignment */}
            <div className="flex flex-col gap-3">
              {(['STR', 'DEX', 'CON', 'INT', 'CHA'] as const).map(stat => {
                const descriptions: Record<string, string> = {
                  STR: 'Physical power. Melee damage.',
                  DEX: 'Agility. Evade. Ranged attacks.',
                  CON: 'Toughness. Determines HP.',
                  INT: 'Smarts. Determines MP. Required for spells.',
                  CHA: 'Presence. Attracts viewers.',
                }
                const current = wizard.statAssignments[stat]
                return (
                  <div key={stat} className="border border-hud-border p-3 flex items-center gap-4">
                    <div className="w-12 text-center">
                      <div className="font-hud text-hud-accent text-lg font-bold">{stat}</div>
                      <div className="font-hud text-hud-muted text-xs">{current !== null ? `mod ${statMod(current) >= 0 ? '+' : ''}${statMod(current)}` : '—'}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-hud text-xs text-hud-muted">{descriptions[stat]}</div>
                    </div>
                    <div className="flex gap-1">
                      {current !== null && (
                        <button
                          onClick={() => assignStat(stat, null)}
                          className="w-10 h-10 border border-hud-border font-hud text-hud-muted text-xs hover:border-red-800 hover:text-red-700 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                      {availableValues.map(val => (
                        <button
                          key={val}
                          onClick={() => assignStat(stat, val)}
                          className="w-10 h-10 border border-hud-border font-hud text-hud-muted hover:border-hud-accent hover:text-hud-accent transition-colors"
                        >
                          {val}
                        </button>
                      ))}
                      {current !== null && (
                        <div className="w-10 h-10 border border-hud-accent font-hud text-hud-accent text-lg flex items-center justify-center">
                          {current}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Derived preview */}
            {Object.values(wizard.statAssignments).every(v => v !== null) && (
              <div className="mt-6 border border-hud-border p-4 grid grid-cols-4 gap-4">
                {[
                  ['EVADE', evade],
                  ['MAX HP', maxHp],
                  ['MAX MP', maxMp],
                  ['MOVE', `${move}ft`],
                ].map(([label, val]) => (
                  <div key={label} className="text-center">
                    <div className="font-hud text-xs text-hud-muted tracking-wider">{label}</div>
                    <div className="font-hud text-hud-accent text-xl">{val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BACKSTORY ─────────────────────────────────────── */}
        {screen === 'BACKSTORY' && (
          <div>
            <ScreenHeader title="STEP 5 — BACKSTORY" step={5} total={6} />
            <p className="font-hud text-hud-muted text-sm mb-6 italic">
              "Events and trauma shaped you. That life is gone now — but every part of it follows you into the dungeon."
            </p>

            {[
              { label: 'PAST TRAUMA', field: 'pastTrauma' as const, placeholder: 'What broke you before the dungeon?' },
              { label: 'LOOSE END', field: 'looseEnd' as const, placeholder: 'What were you in the middle of when the sky cracked?' },
              { label: 'REGRETS', field: 'regrets' as const, placeholder: "What do you wish you'd done differently?" },
            ].map(({ label, field, placeholder }) => (
              <div key={field} className="mb-4">
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">{label}</div>
                <textarea
                  value={wizard[field]}
                  onChange={e => update({ [field]: e.target.value })}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none resize-none"
                />
              </div>
            ))}
          </div>
        )}

        {/* ── REVIEW ───────────────────────────────────────── */}
        {screen === 'REVIEW' && (
          <div>
            <ScreenHeader title="STEP 6 — REVIEW" step={6} total={6} />
            <p className="font-hud text-hud-muted text-sm mb-6 italic">
              "Good luck. Try not to die."
            </p>

            {/* Identity */}
            <div className="border border-hud-border p-4 mb-3">
              <div className="font-hud text-hud-accent text-xl tracking-widest mb-1">{wizard.crawlerName || '???'}</div>
              <div className="font-hud text-hud-muted text-sm">{wizard.playerName} {wizard.pronouns && `· ${wizard.pronouns}`}</div>
              {wizard.preJob && <div className="font-hud text-hud-muted text-xs mt-1 italic">{wizard.preJob}</div>}
            </div>

            {/* Stats */}
            <div className="border border-hud-border p-4 mb-3">
              <div className="font-hud text-xs text-hud-muted tracking-wider mb-3">STATS</div>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {(['STR', 'DEX', 'CON', 'INT', 'CHA'] as const).map(s => (
                  <div key={s} className="text-center">
                    <div className="font-hud text-xs text-hud-muted">{s}</div>
                    <StatPip value={wizard.statAssignments[s]} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center border-t border-hud-border pt-3">
                {[['HP', maxHp], ['MP', maxMp], ['EVADE', evade], ['MOVE', `${move}ft`]].map(([l, v]) => (
                  <div key={l}>
                    <div className="font-hud text-xs text-hud-muted">{l}</div>
                    <div className="font-hud text-hud-text text-sm">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="border border-hud-border p-4 mb-3">
              <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">SKILLS</div>
              {[...allBgSkills(), ...combatSkills()].map((s, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-hud-border/30 last:border-0">
                  <span className="font-hud text-sm text-hud-text">{s.name}</span>
                  <span className="font-hud text-xs text-hud-muted">Rank {s.level} · {s.effortType}</span>
                </div>
              ))}
            </div>

            {/* Backstory */}
            {(wizard.pastTrauma || wizard.looseEnd || wizard.regrets) && (
              <div className="border border-hud-border p-4 mb-3">
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">BACKSTORY</div>
                {wizard.pastTrauma && <div className="font-hud text-xs text-hud-muted mb-2"><span className="text-hud-text">Trauma:</span> {wizard.pastTrauma}</div>}
                {wizard.looseEnd && <div className="font-hud text-xs text-hud-muted mb-2"><span className="text-hud-text">Loose end:</span> {wizard.looseEnd}</div>}
                {wizard.regrets && <div className="font-hud text-xs text-hud-muted"><span className="text-hud-text">Regrets:</span> {wizard.regrets}</div>}
              </div>
            )}

            {error && (
              <div className="font-hud text-sm text-hp-low border border-red-900 px-3 py-2 mb-3">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full border border-hud-accent text-hud-accent font-hud text-sm py-4 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-widest disabled:opacity-50"
            >
              {saving ? 'REGISTERING CRAWLER...' : '⬇ ENTER THE DUNGEON'}
            </button>
          </div>
        )}

      </div>

      {/* Navigation */}
      <div className="border-t border-hud-border p-4 flex justify-between items-center bg-hud-panel">
        <button
          onClick={() => setScreenIdx(i => Math.max(0, i - 1))}
          disabled={screenIdx === 0}
          className="font-hud text-sm border border-hud-border text-hud-muted px-6 py-2 hover:border-hud-accent hover:text-hud-accent transition-colors disabled:opacity-30"
        >
          ← BACK
        </button>

        <div className="font-hud text-xs text-hud-muted tracking-wider">
          {screenIdx + 1} / {SCREENS.length}
        </div>

        {screenIdx < SCREENS.length - 1 ? (
          <button
            onClick={() => { if (canAdvance()) setScreenIdx(i => i + 1) }}
            disabled={!canAdvance()}
            className="font-hud text-sm border border-hud-accent text-hud-accent px-6 py-2 hover:bg-hud-accent hover:text-hud-bg transition-colors disabled:opacity-30 disabled:border-hud-border disabled:text-hud-muted"
          >
            NEXT →
          </button>
        ) : (
          <div className="w-24" /> // spacer
        )}
      </div>
    </div>
  )
}
