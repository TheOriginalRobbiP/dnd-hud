import { useState } from 'react'
import type { Character, FloorState, WSMessage } from '../../types'

interface DiceHeroProps {
  character: Character
  floor: FloorState
  send: (msg: WSMessage) => void
}

const DICE = [4, 6, 8, 10, 12, 20] as const

export function DiceHero({ character, floor, send }: DiceHeroProps) {
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<any>(null)

  const resolve = (raw: number, sides: number) => {
    // simplified version for the hero layout
    const target = floor.roomTarget
    const pass = sides === 20 ? raw >= target : null
    
    setResult({ raw, sides, target, pass })
    setRolling(false)

    // broadcast
    const text = `[${character.crawlerName}] rolled d${sides}(${raw})` + (pass !== null ? ` vs ${target} — ${pass ? 'PASS ✓' : 'FAIL ✗'}` : '')
    send({ type: 'announcement', label: 'Roll', text })
  }

  const rollDigital = (sides: number) => {
    setRolling(true)
    setTimeout(() => {
      const raw = Math.floor(Math.random() * sides) + 1
      resolve(raw, sides)
    }, 150)
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-hud-panel border border-hud-border rounded-xl">
      <div className="font-hud text-sm text-hud-muted tracking-widest mb-6">LATEST ROLL</div>
      
      <div className="font-hud text-8xl text-hud-accent font-bold leading-none mb-8" style={{ textShadow: '0 0 40px rgba(232, 169, 87, 0.4)' }}>
        {rolling ? '…' : (result ? result.raw : '—')}
      </div>
      
      {result && result.pass !== null && !rolling && (
        <div className={`font-hud text-xl tracking-widest mb-8 ${result.pass ? 'text-green-400' : 'text-red-400'}`}>
          {result.pass ? '✓ PASS' : '✗ FAIL'} VS {result.target}
        </div>
      )}

      <div className="flex gap-4 justify-center flex-wrap">
        {DICE.map(d => (
          <button key={d} onClick={() => rollDigital(d)} disabled={rolling}
            className={`font-hud text-xl border rounded-lg transition-colors px-6 py-4 disabled:opacity-50 ${d === 20 ? 'border-hud-accent text-hud-accent bg-hud-accent/10 w-48' : 'border-hud-border text-hud-text hover:border-hud-accent w-24'}`}>
            {d === 20 ? 'ROLL D20' : `D${d}`}
          </button>
        ))}
      </div>
    </div>
  )
}
