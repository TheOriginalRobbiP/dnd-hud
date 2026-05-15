import { useState } from 'react'
import type { Character, FloorState, WSMessage } from '../../types'

interface DiceRollerProps {
  character: Character
  floor: FloorState
  send: (msg: WSMessage) => void
}

const DICE = [4, 6, 8, 10, 12, 20] as const
const NUMPAD = ['7','8','9','4','5','6','1','2','3','⌫','0','✓'] as const

function statMod(val: number) { return Math.floor((val - 4) / 2) }

interface RollResult {
  raw: number          // the die face (physical roll) or digital roll
  mod: number
  modLabel: string
  skillName: string
  skillRank: number
  total: number
  target: number
  pass: boolean | null
  isPhysical: boolean  // true = player rolled real dice
  dieLabel: string     // 'd20' or 'physical'
}

type Mode = 'digital' | 'manual'

export function DiceRoller({ character, floor, send }: DiceRollerProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('digital')
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [selectedStat, setSelectedStat] = useState<'STR'|'DEX'|'CON'|'INT'|'CHA'|null>(null)
  const [result, setResult] = useState<RollResult | null>(null)
  const [rolling, setRolling] = useState(false)
  const [padInput, setPadInput] = useState('')   // manual mode number pad input

  const stats = character.stats as any
  const skills = character.skills as any[]
  const selectedSkill = skills.find(s => s.id === selectedSkillId) ?? null

  // Shared: compute + broadcast a result given a raw die value
  const resolve = (raw: number, dieLabel: string, isPhysical: boolean, useTarget: boolean) => {
    const statVal = selectedStat ? (stats[selectedStat] ?? 4) : 4
    const mod = selectedStat ? statMod(statVal) : 0
    const modLabel = selectedStat ? `${selectedStat}${mod >= 0 ? '+' : ''}${mod}` : ''
    const rank = selectedSkill?.level ?? 0
    const total = raw + mod + rank
    const target = floor.roomTarget
    const pass = useTarget ? total >= target : null

    const r: RollResult = {
      raw, mod, modLabel,
      skillName: selectedSkill?.name ?? '',
      skillRank: rank,
      total, target, pass,
      isPhysical, dieLabel,
    }
    setResult(r)
    setRolling(false)

    // Broadcast
    const parts = [isPhysical ? `physical(${raw})` : `${dieLabel}(${raw})`]
    if (modLabel) parts.push(modLabel)
    if (rank > 0) parts.push(`+Rank${rank}`)
    const passStr = pass === null ? '' : ` vs ${target} — ${pass ? 'PASS ✓' : 'FAIL ✗'}`
    const text = `[${character.crawlerName}] ${selectedSkill ? selectedSkill.name + ': ' : ''}${parts.join(' ')} = ${total}${passStr}`
    send({ type: 'announcement', label: 'Roll', text })
  }

  // Digital roll
  const rollDigital = (sides: number, useTarget = true) => {
    setRolling(true)
    setTimeout(() => {
      const raw = Math.floor(Math.random() * sides) + 1
      resolve(raw, `d${sides}`, false, useTarget && sides === 20)
    }, 120)
  }

  // Manual numpad submit
  const submitManual = () => {
    const raw = parseInt(padInput, 10)
    if (isNaN(raw) || raw < 1) return
    resolve(raw, 'd20', true, true)
    setPadInput('')
  }

  const handlePad = (key: typeof NUMPAD[number]) => {
    if (key === '⌫') { setPadInput(p => p.slice(0, -1)); return }
    if (key === '✓') { submitManual(); return }
    if (padInput.length >= 2) return // d20 max is 20
    setPadInput(p => p + key)
  }

  const STAT_LIST = ['STR','DEX','CON','INT','CHA'] as const

  // ── Collapsed ─────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-hud-border text-hud-muted font-hud text-xs py-2 hover:border-hud-accent hover:text-hud-accent transition-colors tracking-widest flex items-center justify-center gap-2"
      >
        <span>⚄</span> DICE ROLLER
      </button>
    )
  }

  // ── Shared sections ───────────────────────────────────────
  const StatModRow = (
    <div>
      <div className="font-hud text-xs text-hud-muted tracking-wider mb-1.5">STAT MOD</div>
      <div className="flex gap-1">
        {STAT_LIST.map(s => {
          const mod = statMod(stats[s] ?? 4)
          const active = selectedStat === s
          return (
            <button key={s}
              onClick={() => setSelectedStat(active ? null : s)}
              className={`flex-1 border font-hud text-xs py-1.5 transition-colors ${active ? 'border-hud-accent text-hud-accent bg-hud-accent/10' : 'border-hud-border text-hud-muted hover:border-hud-accent'}`}>
              <div>{s}</div>
              <div className="text-xs opacity-70">{mod >= 0 ? '+' : ''}{mod}</div>
            </button>
          )
        })}
        <button onClick={() => setSelectedStat(null)}
          className={`flex-1 border font-hud text-xs py-1.5 transition-colors ${selectedStat === null ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent'}`}>
          <div>—</div>
          <div className="text-xs opacity-70">+0</div>
        </button>
      </div>
    </div>
  )

  const SkillRow = skills.length > 0 && (
    <div>
      <div className="font-hud text-xs text-hud-muted tracking-wider mb-1.5">SKILL RANK (optional)</div>
      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
        {skills.map((sk: any) => (
          <button key={sk.id}
            onClick={() => setSelectedSkillId(selectedSkillId === sk.id ? null : sk.id)}
            className={`font-hud text-xs px-2 py-1 border transition-colors ${selectedSkillId === sk.id ? 'border-hud-accent text-hud-accent bg-hud-accent/10' : 'border-hud-border text-hud-muted hover:border-hud-accent'}`}>
            {sk.name} <span className="opacity-60">Lv{sk.level}</span>
          </button>
        ))}
      </div>
    </div>
  )

  const ResultDisplay = result && (
    <div className={`border p-3 text-center transition-colors ${
      result.pass === true  ? 'border-green-700 bg-green-950/30' :
      result.pass === false ? 'border-red-800 bg-red-950/30' :
      'border-hud-border'
    }`}>
      <div className={`font-hud text-4xl font-bold ${
        result.pass === true ? 'text-green-400' :
        result.pass === false ? 'text-red-400' :
        'text-hud-accent'
      }`}>
        {rolling ? '…' : result.total}
      </div>
      {!rolling && (
        <div className="font-hud text-xs text-hud-muted mt-1">
          {result.isPhysical ? `physical roll(${result.raw})` : `${result.dieLabel}(${result.raw})`}
          {result.modLabel ? ` + ${result.modLabel}` : ''}
          {result.skillRank > 0 ? ` + Rank ${result.skillRank}` : ''}
          {result.skillName ? ` [${result.skillName}]` : ''}
        </div>
      )}
      {result.pass !== null && !rolling && (
        <div className={`font-hud text-sm mt-1 tracking-wider ${result.pass ? 'text-green-400' : 'text-red-400'}`}>
          {result.pass ? '✓ PASS' : '✗ FAIL'} vs {result.target}
        </div>
      )}
    </div>
  )

  // ── Expanded ──────────────────────────────────────────────
  return (
    <div className="border border-hud-border bg-hud-bg flex flex-col gap-3 p-3">

      {/* Header + mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button onClick={() => setMode('digital')}
            className={`font-hud text-xs px-3 py-1 border tracking-wider transition-colors ${mode === 'digital' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent'}`}>
            ⚄ DIGITAL
          </button>
          <button onClick={() => { setMode('manual'); setResult(null); setPadInput('') }}
            className={`font-hud text-xs px-3 py-1 border tracking-wider transition-colors ${mode === 'manual' ? 'border-hud-accent text-hud-accent' : 'border-hud-border text-hud-muted hover:border-hud-accent'}`}>
            🎲 PHYSICAL
          </button>
        </div>
        <button onClick={() => setOpen(false)} className="font-hud text-hud-muted hover:text-hp-low text-xs px-1">✕</button>
      </div>

      {/* Result — shared */}
      {ResultDisplay}

      {/* Stat mod + skill — shared */}
      {StatModRow}
      {SkillRow}

      {/* ── DIGITAL MODE ── */}
      {mode === 'digital' && (
        <>
          <button
            onClick={() => rollDigital(20, true)}
            disabled={rolling}
            className="w-full border-2 border-hud-accent text-hud-accent font-hud py-3 text-sm tracking-widest hover:bg-hud-accent hover:text-hud-bg transition-colors disabled:opacity-40"
          >
            {rolling ? 'ROLLING…' : `ROLL d20${selectedStat ? ` + ${selectedStat}` : ''}${selectedSkill ? ` + ${selectedSkill.name}` : ''} vs ${floor.roomTarget}`}
          </button>

          <div>
            <div className="font-hud text-xs text-hud-muted tracking-wider mb-1.5">QUICK DICE</div>
            <div className="grid grid-cols-6 gap-1">
              {DICE.map(d => (
                <button key={d}
                  onClick={() => rollDigital(d, false)}
                  disabled={rolling}
                  className="border border-hud-border text-hud-muted font-hud text-xs py-2 hover:border-hud-accent hover:text-hud-accent transition-colors disabled:opacity-40">
                  d{d}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── MANUAL MODE ── */}
      {mode === 'manual' && (
        <div className="flex flex-col gap-2">
          <div className="font-hud text-xs text-hud-muted tracking-wider">ENTER YOUR ROLL</div>

          {/* Display */}
          <div className="border border-hud-border bg-hud-panel text-center py-3">
            <span className="font-hud text-4xl text-hud-accent">
              {padInput || '—'}
            </span>
            {padInput && (selectedStat || selectedSkill) && (
              <div className="font-hud text-xs text-hud-muted mt-1">
                {padInput}
                {selectedStat ? ` + ${selectedStat}(${statMod(stats[selectedStat] ?? 4) >= 0 ? '+' : ''}${statMod(stats[selectedStat] ?? 4)})` : ''}
                {selectedSkill ? ` + Rank${selectedSkill.level}` : ''}
                {' = '}
                {parseInt(padInput || '0') +
                  (selectedStat ? statMod(stats[selectedStat] ?? 4) : 0) +
                  (selectedSkill?.level ?? 0)}
              </div>
            )}
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-1">
            {NUMPAD.map(key => (
              <button key={key}
                onClick={() => handlePad(key)}
                className={`font-hud py-3 text-lg border transition-colors ${
                  key === '✓'
                    ? 'border-hud-accent text-hud-accent hover:bg-hud-accent hover:text-hud-bg col-span-1'
                    : key === '⌫'
                    ? 'border-hud-border text-hud-muted hover:border-hp-low hover:text-hp-low'
                    : 'border-hud-border text-hud-text hover:border-hud-accent hover:text-hud-accent'
                }`}>
                {key}
              </button>
            ))}
          </div>

          <div className="font-hud text-xs text-hud-muted italic text-center">
            Enter the number on your physical die, then ✓ to apply mods and submit
          </div>
        </div>
      )}
    </div>
  )
}
