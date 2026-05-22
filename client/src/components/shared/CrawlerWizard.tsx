import { useState } from 'react'
import {
  STAT_ARRAY, COMBAT_SKILLS, YOUTH_BACKGROUNDS, TRAINING_BACKGROUNDS,
  ADULT_BACKGROUNDS, QUIRK_BACKGROUNDS, calcEvade, calcMaxHp, calcMaxMp, calcMove
} from '../../data/characterCreation'
import { bopcaSkills } from '../../data/bopcaSkills'

// ── Stat Labels ───────────────────────────────────────────────
const STAT_LABELS: Record<string, string> = {
  STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution', INT: 'Intelligence', CHA: 'Charisma'
}

// ── Portrait data ─────────────────────────────────────────────
const PREGEN_PORTRAITS = [
  { path: '/images/crawlers/doris.png',  label: 'DORIS',  desc: 'The one who\'s done all the reading.' },
  { path: '/images/crawlers/miles.png',  label: 'MILES',  desc: 'Arrived holding a glowing drink. Still holding it.' },
  { path: '/images/crawlers/flex.png',   label: 'FLEX',   desc: 'Built like a question, answers with his fists.' },
  { path: '/images/crawlers/quill.png',  label: 'QUILL',  desc: 'Taking notes. Panicking. Taking more notes.' },
  { path: '/images/crawlers/rex.png',    label: 'REX',    desc: 'Has seen worse. Won\'t say when.' },
  { path: '/images/crawlers/sugar.png',  label: 'SUGAR',  desc: 'Genuinely excited. That\'s the scary part.' },
  { path: '/images/crawlers/vance.png',  label: 'VANCE',  desc: 'Trust him. No, seriously. Trust him.' },
]

const POOL_PORTRAITS = Array.from({ length: 8 }, (_, i) => ({
  path: `/images/pool/portrait-0${i + 1}.png`,
  label: `UNKNOWN #${i + 1}`,
}))

// ── Types ────────────────────────────────────────────────────
interface WizardSkill {
  name: string
  level: number
  effortType: 'basic' | 'weapon' | 'magic'
  description: string
}

interface WizardState {
  // Screen 0 — Portrait
  portrait: string
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
  // Screen 3 — Combat Starting Gear
  combatSkillIdx: number | null
  combatSkill2Idx: number | null // unarmed (always Unarmed Combat at rank 3)
  // Screen 4 — Stats
  statAssignments: { STR: number | null; DEX: number | null; CON: number | null; INT: number | null; CHA: number | null }
  // Screen 5 — Backstory
  pastTrauma: string
  looseEnd: string
  regrets: string
  // Screen 6 — Review (no extra data)
  // Bonus — Bopca skill
  bopcaSkill: string
}

const SCREENS = ['PORTRAIT', 'IDENTITY', 'BACKGROUNDS', 'COMBAT', 'STATS', 'BACKSTORY', 'REVIEW'] as const

interface CrawlerWizardProps {
  onClose: () => void
  onComplete: (character: any) => void
}

const INITIAL: WizardState = {
  portrait: '',
  crawlerName: '', playerName: '', pronouns: '', preJob: '', crawlerNumber: '',
  youthBg: null, youthSkills: ['', ''],
  trainingBg: null, trainingSkills: ['', ''],
  adultBg: null, adultSkills: ['', ''],
  quirkyBg: null, quirkySkills: ['', ''],
  combatSkillIdx: null, combatSkill2Idx: null,
  statAssignments: { STR: null, DEX: null, CON: null, INT: null, CHA: null },
  pastTrauma: '', looseEnd: '', regrets: '',
  bopcaSkill: '',
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
    <div className="border border-hud-border p-3 mb-3 rounded bg-hud-panel/10">
      <div className="font-hud text-xs text-hud-muted tracking-wider mb-2 flex justify-between items-center">
        <span>{label}</span>
        <button
          onClick={() => onSelect(rollD6() - 1)}
          className="text-xs border border-hud-border text-hud-muted px-2 py-0.5 hover:border-hud-accent hover:text-hud-accent transition-colors rounded-sm"
        >
          ROLL d6
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1 mb-2">
        {table.map((b, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`font-hud text-xs py-1.5 px-2 border transition-colors rounded ${selected === i ? 'border-hud-accent text-hud-accent bg-hud-accent/5' : 'border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent'}`}
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
                className={`font-hud text-xs py-1 px-2 border transition-colors rounded-sm ${chosenSkills.includes(s) ? 'border-hud-accent text-hud-accent bg-hud-accent/10' : 'border-hud-border text-hud-muted hover:border-hud-accent'}`}
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
  const [bopSearchVal, setBopSearchVal] = useState('')

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
      case 'PORTRAIT': return wizard.portrait !== ''
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

      // Add Bopca bonus skill if chosen
      if (wizard.bopcaSkill) {
        const bopData = bopcaSkills.find(s => s.name === wizard.bopcaSkill)
        skills.push({
          id: crypto.randomUUID(),
          name: wizard.bopcaSkill,
          level: 1,
          effortType: 'basic',
          description: bopData?.description ?? '',
        })
      }

      // Generate starting inventory containing selected gear
      const startingInventory: any[] = []
      if (wizard.combatSkillIdx !== null) {
        const cs = COMBAT_SKILLS[wizard.combatSkillIdx]
        const weaponId = crypto.randomUUID()
        
        startingInventory.push({
          id: weaponId,
          name: cs.name,
          description: cs.description,
          tier: 'common' as const,
          isEquipped: true, // auto-equip on spawn!
          equippedSlot: 'mainHand' as const,
          fromLootBox: false,
          lootBoxTier: null,
          isConsumable: false,
        })

        // Add 5 Standard Mana Potions if they choose a starter spell
        if (cs.effortType === 'magic') {
          for (let i = 0; i < 5; i++) {
            startingInventory.push({
              id: crypto.randomUUID(),
              name: 'Standard Mana Potion',
              description: 'Drink to restore 5 MP instantly.',
              tier: 'common' as const,
              isEquipped: false,
              equippedSlot: null,
              fromLootBox: false,
              lootBoxTier: null,
              isConsumable: true,
              charges: null,
              hpEffect: null,
              mpEffect: 5,
            })
          }
        }
      }

      const body = {
        crawlerName: wizard.crawlerName.trim().toUpperCase(),
        playerName: wizard.playerName.trim(),
        portrait: wizard.portrait || null,
        hp: maxHp, maxHp,
        mp: maxMp, maxMp,
        stats: { STR: str, DEX: dex, CON: con, INT: int_, CHA: cha, WIS: 4 },
        skills,
        equipment: {}, // Server auto-maps isEquipped startingInventory items into equipment slots!
        inventory: startingInventory,
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
      // Small delay to let WS state sync catch up before navigating
      await new Promise(r => setTimeout(r, 800))
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

        {/* ── PORTRAIT ─────────────────────────────────────── */}
        {screen === 'PORTRAIT' && (
          <div>
            <ScreenHeader title="STEP 1 — CHOOSE YOUR FACE" step={1} total={7} />
            <p className="font-hud text-hud-muted text-sm mb-6 italic">
              "Before you were a crawler, you were a person. Pick the face that fits."
            </p>

            {/* Pre-gen portraits */}
            <div className="font-hud text-xs text-hud-muted tracking-wider mb-3">PRE-GENERATED CRAWLERS</div>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {PREGEN_PORTRAITS.map(p => (
                <button
                  key={p.path}
                  onClick={() => update({ portrait: p.path })}
                  title={p.desc}
                  className={`relative border-2 transition-all overflow-hidden aspect-[3/4] rounded-lg ${wizard.portrait === p.path ? 'border-hud-accent' : 'border-hud-border hover:border-hud-accent/60'}`}
                >
                  <img src={p.path} alt={p.label} className="w-full h-full object-cover object-top" />
                  <div className={`absolute bottom-0 inset-x-0 py-1 font-hud text-[10px] tracking-wider text-center transition-colors ${wizard.portrait === p.path ? 'bg-hud-accent text-hud-bg' : 'bg-hud-bg/80 text-hud-muted'}`}>
                    {p.label}
                  </div>
                </button>
              ))}
            </div>

            {/* Pool portraits */}
            <div className="font-hud text-xs text-hud-muted tracking-wider mb-3">CUSTOM CHARACTER PORTRAITS</div>
            <div className="grid grid-cols-4 gap-2">
              {POOL_PORTRAITS.map(p => (
                <button
                  key={p.path}
                  onClick={() => update({ portrait: p.path })}
                  className={`relative border-2 transition-all overflow-hidden aspect-[3/4] rounded-lg ${wizard.portrait === p.path ? 'border-hud-accent' : 'border-hud-border hover:border-hud-accent/60'}`}
                >
                  <img src={p.path} alt={p.label} className="w-full h-full object-cover object-top" />
                  {wizard.portrait === p.path && (
                    <div className="absolute bottom-0 inset-x-0 py-1 font-hud text-[10px] tracking-wider text-center bg-hud-accent text-hud-bg">
                      SELECTED
                    </div>
                  )}
                </button>
              ))}
            </div>

            {wizard.portrait && (
              <div className="mt-4 border border-hud-accent/40 p-3 flex items-center gap-3 rounded bg-hud-panel/10">
                <img src={wizard.portrait} alt="Selected" className="w-12 h-16 object-cover object-top border border-hud-accent rounded" />
                <div>
                  <div className="font-hud text-xs text-hud-accent tracking-wider">PORTRAIT SELECTED</div>
                  {PREGEN_PORTRAITS.find(p => p.path === wizard.portrait)?.desc && (
                    <div className="font-hud text-xs text-hud-muted italic mt-1">
                      "{PREGEN_PORTRAITS.find(p => p.path === wizard.portrait)?.desc}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── IDENTITY ─────────────────────────────────────── */}
        {screen === 'IDENTITY' && (
          <div>
            <ScreenHeader title="STEP 2 — IDENTITY" step={2} total={7} />
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
                    className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none uppercase rounded"
                  />
                </div>
                <div>
                  <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">PLAYER NAME *</div>
                  <input
                    value={wizard.playerName}
                    onChange={e => update({ playerName: e.target.value })}
                    placeholder="e.g. Rob"
                    className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none rounded"
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
                    className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none rounded"
                  />
                </div>
                <div>
                  <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">CRAWLER NUMBER</div>
                  <input
                    value={wizard.crawlerNumber}
                    onChange={e => update({ crawlerNumber: e.target.value })}
                    placeholder="500000–12900000"
                    type="number"
                    className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none rounded"
                  />
                </div>
              </div>

              <div>
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">YOUR JOB / LIFE BEFORE THE DUNGEON</div>
                <input
                  value={wizard.preJob}
                  onChange={e => update({ preJob: e.target.value })}
                  placeholder="e.g. Retired bingo hall manager from Wolverhampton"
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-2 focus:border-hud-accent outline-none rounded"
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
            <ScreenHeader title="STEP 3 — BACKGROUNDS" step={3} total={7} />
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

            {/* ── BOPCA BONUS SKILL ─────────────────────────── */}
            <div className="border border-hud-border p-3 mb-3 rounded bg-hud-panel/10">
              <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">
                BONUS SKILL — BOPCA COMMUNITY (Optional)
              </div>
              <p className="font-hud text-xs text-hud-muted italic mb-3">
                Pick one fan-created skill from the Bopca Community Center. These are weird, flavourful, and not in the official rulebook.
              </p>
              <div className="relative mb-2">
                <input
                  placeholder="Search Bopca skills..."
                  onChange={e => {
                    const val = e.target.value.toLowerCase()
                    setBopSearchVal(val)
                  }}
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-2 focus:border-hud-accent outline-none rounded"
                />
              </div>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {bopcaSkills
                  .filter(s => !bopSearchVal || s.name.toLowerCase().includes(bopSearchVal))
                  .map(s => (
                    <button
                      key={s.name}
                      title={s.description}
                      onClick={() => update({ bopcaSkill: wizard.bopcaSkill === s.name ? '' : s.name })}
                      className={`font-hud text-xs py-1 px-2 border transition-colors rounded-sm ${wizard.bopcaSkill === s.name ? 'border-hud-accent text-hud-accent bg-hud-accent/10' : 'border-hud-border text-hud-muted hover:border-hud-accent'}`}
                    >
                      {s.name}
                    </button>
                  ))
                }
              </div>
              {wizard.bopcaSkill && (
                <div className="mt-2 font-hud text-xs text-hud-muted italic border-l-2 border-hud-accent pl-2">
                  {bopcaSkills.find(s => s.name === wizard.bopcaSkill)?.description}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMBAT STARTING GEAR ─────────────────────────── */}
        {screen === 'COMBAT' && (
          <div>
            <ScreenHeader title="STEP 4 — PANIC HOUSEHOLD SCROUNGE" step={4} total={7} />
            <p className="font-hud text-hud-muted text-sm mb-2 italic text-hud-accent">
              "The sky split, the buildings collapsed, and the Syndicate AI announced the Crawl. You had exactly ONE HOUR to scrounge your house, kitchen, or garden shed before being forced down. What did you grab to survive?"
            </p>
            <p className="font-hud text-xs text-hud-muted mb-6">
              Choosing gear automatically grants you the matching Weapon Proficiency skill at Level 3 and spawns it equipped in your Main Hand on spawn! Weird attic relics (Spells) require INT 4+ and include 5 Standard Mana Potions in your inventory.
            </p>

            {['Bashing', 'Edged', 'Ranged', 'Reach', 'Hand-to-Hand', 'Animal', 'Spell'].map(type => {
              const typeSkills = COMBAT_SKILLS.filter(s => s.type === type)
              return (
                <div key={type} className="mb-4">
                  <div className="font-hud text-xs text-hud-muted tracking-wider mb-2 border-b border-hud-border pb-1">
                    {type.toUpperCase()} STARTING KITS
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {typeSkills.map((cs, i) => {
                      const idx = COMBAT_SKILLS.indexOf(cs)
                      const selected = wizard.combatSkillIdx === idx
                      return (
                        <button
                          key={i}
                          onClick={() => update({ combatSkillIdx: idx })}
                          className={`text-left px-3 py-2.5 border font-hud transition-colors rounded ${selected ? 'border-hud-accent bg-hud-accent/10' : 'border-hud-border hover:border-hud-accent bg-hud-panel/40'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-sm ${selected ? 'text-hud-accent font-bold' : 'text-hud-text'}`}>
                              {cs.effortType === 'magic' ? '🔮' : '⚔️'} {cs.name}
                            </span>
                            <span className="text-xs text-hud-accent font-mono font-bold">{cs.damage}</span>
                          </div>
                          <div className="text-xs text-hud-muted mt-1 leading-relaxed">{cs.description}</div>
                          {cs.effortType === 'magic' && (
                            <div className="text-[10px] text-cyan-400 mt-1 italic font-bold">
                              Includes 5× Standard Mana Potions in inventory!
                            </div>
                          )}
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
            <ScreenHeader title="STEP 5 — ASSIGN STATS" step={5} total={7} />
            <p className="font-hud text-hud-muted text-sm mb-2 italic">
              "You can be reduced to a number. Or a few numbers, all of which round down to zero in the infinite expanse of the universe."
            </p>
            <p className="font-hud text-xs text-hud-muted mb-6">
              Standard array: assign 2, 3, 4, 5, and 6 — one to each stat.
            </p>

            {/* Available pool */}
            <div className="mb-6">
              <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">AVAILABLE SCORE POOL</div>
              <div className="flex gap-2">
                {STAT_ARRAY.map(val => {
                  const used = assignedValues.includes(val)
                  return (
                    <div
                      key={val}
                      className={`flex-1 border text-center py-3 font-hud text-lg rounded ${
                        used ? 'border-hud-border/20 text-hud-muted/30 bg-hud-panel/5 line-through' : 'border-hud-accent text-hud-accent bg-hud-accent/5 font-bold'
                      }`}
                    >
                      {val}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Assignment grid */}
            <div className="flex flex-col gap-3">
              {(['STR', 'DEX', 'CON', 'INT', 'CHA'] as const).map(stat => {
                const currentVal = wizard.statAssignments[stat]
                return (
                  <div key={stat} className="border border-hud-border p-3 flex justify-between items-center bg-hud-panel rounded">
                    <div>
                      <div className="font-hud text-sm text-hud-text font-bold">{stat}</div>
                      <div className="font-hud text-xs text-hud-muted mt-0.5">{STAT_LABELS[stat]}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Clear button if assigned */}
                      {currentVal !== null && (
                        <button
                          onClick={() => assignStat(stat, null)}
                          className="font-hud text-[10px] border border-red-900 text-red-400 px-2 py-1 hover:bg-red-950/20 rounded"
                        >
                          CLEAR
                        </button>
                      )}
                      
                      {/* Selection row */}
                      {currentVal !== null ? (
                        <div className="font-hud text-2xl text-hud-accent font-bold px-3">
                          {currentVal}
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          {availableValues.map(val => (
                            <button
                              key={val}
                              onClick={() => assignStat(stat, val)}
                              className="font-hud text-xs border border-hud-border text-hud-muted hover:border-hud-accent hover:text-hud-accent px-2.5 py-1.5 transition-colors rounded-sm"
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── BACKSTORY ────────────────────────────────────── */}
        {screen === 'BACKSTORY' && (
          <div>
            <ScreenHeader title="STEP 6 — BACKSTORY" step={6} total={7} />
            <p className="font-hud text-hud-muted text-sm mb-6 italic">
              "We all run from something. What brought you to the pit?"
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-1 flex justify-between items-center">
                  <span>PAST TRAUMA (Dungeon Motivation)</span>
                  <span className="text-[10px] italic">optional</span>
                </div>
                <textarea
                  value={wizard.pastTrauma}
                  onChange={e => update({ pastTrauma: e.target.value })}
                  placeholder="e.g. My village was crushed by a migrating construct and the System wouldn't reimburse the insurance."
                  rows={2}
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-2 focus:border-hud-accent outline-none resize-none rounded"
                />
              </div>

              <div>
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-1 flex justify-between items-center">
                  <span>LOOSE ENDS (Your anchor outside)</span>
                  <span className="text-[10px] italic">optional</span>
                </div>
                <textarea
                  value={wizard.looseEnd}
                  onChange={e => update({ looseEnd: e.target.value })}
                  placeholder="e.g. Left a slow-cooker plugged in at my flat, need to get rich and get back before it burns down."
                  rows={2}
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-2 focus:border-hud-accent outline-none resize-none rounded"
                />
              </div>

              <div>
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-1 flex justify-between items-center">
                  <span>REGRETS</span>
                  <span className="text-[10px] italic">optional</span>
                </div>
                <textarea
                  value={wizard.regrets}
                  onChange={e => update({ regrets: e.target.value })}
                  placeholder="e.g. Trusting the recruitment flyer."
                  rows={2}
                  className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-xs p-2 focus:border-hud-accent outline-none resize-none rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── REVIEW ───────────────────────────────────────── */}
        {screen === 'REVIEW' && (
          <div>
            <ScreenHeader title="STEP 7 — REVIEW" step={7} total={7} />
            <p className="font-hud text-hud-muted text-sm mb-6 italic">
              "Good luck. Try not to die."
            </p>

            {/* Identity */}
            <div className="border border-hud-border p-4 mb-3 rounded bg-hud-panel/30">
              <div className="font-hud text-hud-accent text-xl tracking-widest mb-1">{wizard.crawlerName || '???'}</div>
              <div className="font-hud text-hud-muted text-sm">{wizard.playerName} {wizard.pronouns && `· ${wizard.pronouns}`}</div>
              {wizard.preJob && <div className="font-hud text-hud-muted text-xs mt-1 italic">{wizard.preJob}</div>}
            </div>

            {/* Stats */}
            <div className="border border-hud-border p-4 mb-3 rounded bg-hud-panel/30">
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

            {/* Starting Gear Card */}
            {wizard.combatSkillIdx !== null && (
              <div className="border border-hud-border p-4 mb-3 rounded bg-hud-panel/30">
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">STARTING GEAR & KITS</div>
                {(() => {
                  const cs = COMBAT_SKILLS[wizard.combatSkillIdx]
                  const isMagic = cs.effortType === 'magic'
                  return (
                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between items-center text-sm text-hud-text">
                        <span className="font-bold">⚔️ {cs.name} (Main Hand)</span>
                        <span className="text-hud-accent font-hud text-[10px] font-bold">WEARING</span>
                      </div>
                      {isMagic && (
                        <div className="flex justify-between items-center text-sm text-hud-muted border-t border-hud-border/10 pt-1 mt-1">
                          <span>🧪 Standard Mana Potion (x5)</span>
                          <span className="text-hud-muted font-hud text-[10px]">CARRYING</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Skills */}
            <div className="border border-hud-border p-4 mb-3 rounded bg-hud-panel/30">
              <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">SKILLS & PROFICIENCIES</div>
              {[...allBgSkills(), ...combatSkills()].map((s, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-hud-border/30 last:border-0">
                  <span className="font-hud text-sm text-hud-text">{s.name}</span>
                  <span className="font-hud text-xs text-hud-muted">Rank {s.level} · {s.effortType}</span>
                </div>
              ))}
            </div>

            {/* Backstory */}
            {(wizard.pastTrauma || wizard.looseEnd || wizard.regrets) && (
              <div className="border border-hud-border p-4 mb-3 rounded bg-hud-panel/30">
                <div className="font-hud text-xs text-hud-muted tracking-wider mb-2">BACKSTORY</div>
                {wizard.pastTrauma && <div className="font-hud text-xs text-hud-muted mb-2"><span className="text-hud-text">Trauma:</span> {wizard.pastTrauma}</div>}
                {wizard.looseEnd && <div className="font-hud text-xs text-hud-muted mb-2"><span className="text-hud-text">Loose end:</span> {wizard.looseEnd}</div>}
                {wizard.regrets && <div className="font-hud text-xs text-hud-muted"><span className="text-hud-text">Regrets:</span> {wizard.regrets}</div>}
              </div>
            )}

            {error && (
              <div className="font-hud text-sm text-hp-low border border-red-900 px-3 py-2 mb-3 rounded">{error}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full border border-hud-accent text-hud-accent font-hud text-sm py-4 hover:bg-hud-accent hover:text-hud-bg transition-colors tracking-widest disabled:opacity-50 rounded"
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
          className="font-hud text-sm border border-hud-border text-hud-muted px-6 py-2 hover:border-hud-accent hover:text-hud-accent transition-colors disabled:opacity-30 rounded"
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
            className="font-hud text-sm border border-hud-accent text-hud-accent px-6 py-2 hover:bg-hud-accent hover:text-hud-bg transition-colors disabled:opacity-30 disabled:border-hud-border disabled:text-hud-muted rounded"
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