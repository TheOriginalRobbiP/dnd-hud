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

  const mainHand = character.equipment?.mainHand

  // Classify equipped weapon as ranged (guns) vs melee
  const isRanged = mainHand
    ? /shotgun|pistol|rifle|gun|bow|blunderbuss|ranged|firearm|musket|revolver|laser/i.test(mainHand.name + ' ' + mainHand.description)
    : false

  const statVal = isRanged ? (character.stats.DEX ?? 4) : (character.stats.STR ?? 4)
  const statName = isRanged ? 'DEX' : 'STR'
  const statMod = Math.floor((statVal - 4) / 2)

  // Find general Weapon check skill level if trained
  const weaponSkill = character.skills.find(s => s.name.toLowerCase().includes('weapon') || s.name.toLowerCase().includes('combat'))
  const skillRank = weaponSkill?.level ?? 0

  const checkMod = statMod + skillRank
  const effortDie = isRanged ? 8 : 6

  const resolve = (raw: number, sides: number) => {
    const target = floor.roomTarget
    const pass = sides === 20 ? raw >= target : null
    
    setResult({ raw, sides, target, pass, isWeaponAttack: false, isWeaponDamage: false, total: raw })
    setRolling(false)

    // broadcast standard roll
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

  const rollWeaponAttack = () => {
    if (!mainHand) return
    setRolling(true)
    setTimeout(() => {
      const raw = Math.floor(Math.random() * 20) + 1
      const total = raw + checkMod
      const target = floor.roomTarget
      const pass = total >= target
      
      setResult({ raw, sides: 20, target, pass, isWeaponAttack: true, isWeaponDamage: false, total })
      setRolling(false)

      const modParts = [`${statName}(${statMod >= 0 ? '+' : ''}${statMod})`]
      if (skillRank > 0) modParts.push(`Rank(${skillRank})`)
      const text = `[${character.crawlerName}] attacked with **${mainHand.name}**: d20(${raw}) + ${modParts.join('+')} = **${total}** vs Room Target ${target} — ${pass ? 'HIT ✓' : 'MISS ✗'}`
      send({ type: 'announcement', label: 'Combat', text })
    }, 150)
  }

  const rollWeaponDamage = () => {
    if (!mainHand) return
    setRolling(true)
    setTimeout(() => {
      const raw = Math.floor(Math.random() * effortDie) + 1
      const total = raw + statMod
      
      setResult({ raw, sides: effortDie, target: null, pass: null, isWeaponAttack: false, isWeaponDamage: true, total })
      setRolling(false)

      const text = `[${character.crawlerName}] rolled damage for **${mainHand.name}**: d${effortDie}(${raw}) + ${statName}(${statMod >= 0 ? '+' : ''}${statMod}) = **${total} ${isRanged ? 'Guns' : 'Weapon'} Effort** 💥`
      send({ type: 'announcement', label: 'Combat', text })
    }, 150)
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-hud-panel border border-hud-border rounded-xl">
      <div className="font-hud text-xs text-hud-muted tracking-widest mb-4">LATEST ACTION ROLL</div>
      
      <div className="font-hud text-7xl text-hud-accent font-bold leading-none mb-6" style={{ textShadow: '0 0 45px rgba(232, 169, 87, 0.45)' }}>
        {rolling ? '…' : (result ? result.total : '—')}
      </div>
      
      {result && !rolling && (
        <div className="text-center mb-6 h-6">
          {result.isWeaponAttack ? (
            <div className={`font-hud text-sm tracking-wider font-bold uppercase ${result.pass ? 'text-green-400' : 'text-red-400'}`}>
              {result.pass ? '🎯 HIT' : '✗ MISS'} (rolled {result.raw} + {checkMod} vs {result.target})
            </div>
          ) : result.isWeaponDamage ? (
            <div className="font-hud text-sm text-amber-400 tracking-wider font-bold uppercase">
              💥 {result.total} {isRanged ? 'Guns' : 'Weapon'} Effort (rolled {result.raw} + {statMod})
            </div>
          ) : result.pass !== null ? (
            <div className={`font-hud text-sm tracking-wider font-bold uppercase ${result.pass ? 'text-green-400' : 'text-red-400'}`}>
              {result.pass ? '✓ PASS' : '✗ FAIL'} VS {result.target}
            </div>
          ) : (
            <div className="font-hud text-xs text-hud-muted">
              Rolled d{result.sides} (raw {result.raw})
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2.5 justify-center flex-wrap w-full border-b border-hud-border/20 pb-5 mb-5">
        {DICE.map(d => (
          <button key={d} onClick={() => rollDigital(d)} disabled={rolling}
            className={`font-hud transition-all rounded-lg disabled:opacity-50 ${
              d === 20 
                ? 'border border-hud-accent text-hud-accent bg-hud-accent/10 px-5 py-3 text-base flex-1 min-w-[120px] font-bold tracking-wider' 
                : 'border border-hud-border text-hud-text hover:border-hud-accent px-4 py-2.5 text-xs w-[68px]'
            }`}>
            {d === 20 ? 'ROLL D20' : `d${d}`}
          </button>
        ))}
      </div>

      {/* Dynamic Equipped Weapon Action Card */}
      {mainHand && (
        <div className="w-full border border-hud-accent/20 bg-hud-accent/5 p-4 rounded-lg flex flex-col gap-3 border-dashed">
          <div className="flex items-center justify-between border-b border-hud-border/20 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">{isRanged ? '🔫' : '⚔️'}</span>
              <div className="min-w-0">
                <span className="font-hud text-[8px] text-hud-accent tracking-widest uppercase block leading-none">EQUIPPED MAIN HAND</span>
                <span className="font-hud text-xs text-hud-text font-bold leading-tight truncate block" title={mainHand.name}>{mainHand.name}</span>
              </div>
            </div>
            <span className="font-hud text-[8px] px-1.5 py-0.5 border border-hud-accent/30 text-hud-accent rounded-sm uppercase font-bold shrink-0 bg-hud-accent/5">
              {isRanged ? 'RANGED / GUN' : 'MELEE / WEAPON'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            {/* Roll Attack Check Button */}
            <button
              onClick={rollWeaponAttack}
              disabled={rolling}
              className="font-hud text-[10px] border border-hud-accent text-hud-accent bg-hud-accent/15 hover:bg-hud-accent/30 transition-all rounded py-2 flex flex-col items-center justify-center gap-0.5 font-bold tracking-wider leading-none"
            >
              <span>🎯 ROLL ATTACK</span>
              <span className="text-[7.5px] font-normal opacity-70 leading-none mt-1">
                d20 {checkMod >= 0 ? '+' : ''}{checkMod} ({statName} {statMod >= 0 ? '+' : ''}{statMod}{skillRank > 0 ? `, Lv${skillRank}` : ''})
              </span>
            </button>

            {/* Roll Damage / Effort Button */}
            <button
              onClick={rollWeaponDamage}
              disabled={rolling}
              className="font-hud text-[10px] border border-amber-600 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40 transition-all rounded py-2 flex flex-col items-center justify-center gap-0.5 font-bold tracking-wider leading-none"
            >
              <span>💥 ROLL DAMAGE</span>
              <span className="text-[7.5px] font-normal opacity-70 leading-none mt-1">
                d{effortDie} {statMod >= 0 ? '+' : ''}{statMod} ({statName} mod)
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}