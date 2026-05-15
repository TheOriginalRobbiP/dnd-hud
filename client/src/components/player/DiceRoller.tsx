import { useState } from 'react'
import type { Character, FloorState, WSMessage } from '../../types'

interface DiceRollerProps {
  character: Character
  floor: FloorState
  send: (msg: WSMessage) => void
}

const DICE = [4, 6, 8, 10, 12, 20] as const

function statMod(val: number) { return Math.floor((val - 4) / 2) }

interface RollResult {
  die: number
  raw: number
  mod: number
  modLabel: string
  skillName: string
  skillRank: number
  total: number
  target: number
  pass: boolean | null  // null = no target (free roll)
}

export function DiceRoller({ character, floor, send }: DiceRollerProps) {
  const [open, setOpen] = useState(false)
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [selectedStat, setSelectedStat] = useState<'STR'|'DEX'|'CON'|'INT'|'CHA'|null>(null)
  const [result, setResult] = useState<RollResult | null>(null)
  const [rolling, setRolling] = useState(false)

  const stats = character.stats as any
  const skills = character.skills as any[]

  const selectedSkill = skills.find(s => s.id === selectedSkillId) ?? null

  const roll = (sides: number, useTarget = true) => {
    setRolling(true)
    setTimeout(() => {
      const raw = Math.floor(Math.random() * sides) + 1
      const statVal = selectedStat ? (stats[selectedStat] ?? 4) : 4
      const mod = selectedStat ? statMod(statVal) : 0
      const modLabel = selectedStat ? `${selectedStat}${mod >= 0 ? '+' : ''}${mod}` : ''
      const rank = selectedSkill?.level ?? 0
      const total = raw + mod + rank
      const target = floor.roomTarget
      const pass = useTarget && sides === 20 ? total >= target : null

      const r: RollResult = {
        die: sides, raw, mod, modLabel,
        skillName: selectedSkill?.name ?? '',
        skillRank: rank,
        total, target, pass,
      }
      setResult(r)
      setRolling(false)

      // Broadcast to GM if it's a d20 check
      if (sides === 20) {
        const parts = [`d20(${raw})`]
        if (modLabel) parts.push(modLabel)
        if (rank > 0) parts.push(`+Rank${rank}`)
        const resultStr = pass === null
          ? `${parts.join(' ')} = ${total}`
          : `${parts.join(' ')} = ${total} vs ${target} — ${pass ? 'PASS ✓' : 'FAIL ✗'}`
        send({
          type: 'announcement',
          label: 'Roll',
          text: `[${character.crawlerName}] ${selectedSkill ? selectedSkill.name + ': ' : ''}${resultStr}`,
        })
      }
    }, 120)
  }

  const STAT_LIST = ['STR','DEX','CON','INT','CHA'] as const

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

  return (
    <div className="border border-hud-border bg-hud-bg flex flex-col gap-3 p-3">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="font-hud text-xs text-hud-accent tracking-widest">DICE ROLLER</div>
        <button onClick={() => setOpen(false)} className="font-hud text-hud-muted hover:text-hp-low text-xs px-1">✕</button>
      </div>

      {/* Result display */}
      {result && (
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
              d{result.die}({result.raw})
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
      )}

      {/* Stat modifier selector */}
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

      {/* Skill selector (top skills only) */}
      {skills.length > 0 && (
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
      )}

      {/* d20 check — main action */}
      <button
        onClick={() => roll(20, true)}
        disabled={rolling}
        className="w-full border-2 border-hud-accent text-hud-accent font-hud py-3 text-sm tracking-widest hover:bg-hud-accent hover:text-hud-bg transition-colors disabled:opacity-40"
      >
        {rolling ? 'ROLLING…' : `ROLL d20${selectedStat ? ` + ${selectedStat}` : ''}${selectedSkill ? ` + ${selectedSkill.name}` : ''} vs ${floor.roomTarget}`}
      </button>

      {/* Quick dice row — raw rolls, no target */}
      <div>
        <div className="font-hud text-xs text-hud-muted tracking-wider mb-1.5">QUICK DICE</div>
        <div className="grid grid-cols-6 gap-1">
          {DICE.map(d => (
            <button key={d}
              onClick={() => roll(d, false)}
              disabled={rolling}
              className="border border-hud-border text-hud-muted font-hud text-xs py-2 hover:border-hud-accent hover:text-hud-accent transition-colors disabled:opacity-40">
              d{d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
