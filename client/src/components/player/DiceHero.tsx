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
  
  // 'digital' = HUD rolls automatically, 'manual' = player enters physical table roll
  const [rollMode, setRollMode] = useState<'digital' | 'manual'>('digital')
  const [manualInputOpen, setManualInputOpen] = useState(false)
  const [manualSides, setManualSides] = useState<number>(20)
  const [manualType, setManualType] = useState<'raw' | 'attack' | 'damage'>('raw')
  const [manualValue, setManualValue] = useState('')
  const [targetMobId, setTargetMobId] = useState<string>('')

  const mainHand = character.equipment?.mainHand

  // Classify equipped weapon as ranged (guns) vs melee
  const isRanged = mainHand
    ? /shotgun|pistol|rifle|gun|bow|blunderbuss|ranged|firearm|musket|revolver|laser/i.test(mainHand.name + ' ' + mainHand.description)
    : false

  const targetMob = floor.activeMobs?.find(m => m.id === targetMobId) || null
  const weaponRange = (mainHand as any)?.range || (isRanged ? 'near' : 'melee')
  
  let targetDistance = 0
  let isOutOfRange = false
  
  if (targetMob) {
    const charX = character.tokenPosX ?? 50
    const charY = character.tokenPosY ?? 50
    const mobX = (targetMob as any).posX ?? 50
    const mobY = (targetMob as any).posY ?? 50
    
    const dx = charX - mobX
    const dy = charY - mobY
    targetDistance = Math.sqrt(dx*dx + dy*dy)
    
    if (weaponRange === 'melee' && targetDistance >= 15) {
      isOutOfRange = true
    } else if (weaponRange === 'near' && targetDistance >= 45) {
      isOutOfRange = true
    }
  }

  const statVal = isRanged ? (character.stats.DEX ?? 4) : (character.stats.STR ?? 4)
  const statName = isRanged ? 'DEX' : 'STR'
  const statMod = Math.floor((statVal - 4) / 2)

  // Find general Weapon check skill level if trained
  const weaponSkill = character.skills.find(s => s.name.toLowerCase().includes('weapon') || s.name.toLowerCase().includes('combat'))
  const skillRank = weaponSkill?.level ?? 0

  const checkMod = statMod + skillRank
  const effortDie = isRanged ? 8 : 6

  const resolve = (raw: number, sides: number, isPhysical = false) => {
    const target = floor.roomTarget
    const pass = sides === 20 ? raw >= target : null
    
    setResult({ 
      raw, 
      sides, 
      target, 
      pass, 
      isWeaponAttack: false, 
      isWeaponDamage: false, 
      isPhysical,
      total: raw 
    })
    setRolling(false)

    // broadcast standard roll
    const text = `[${character.crawlerName}] rolled ${isPhysical ? 'physical' : 'digital'} d${sides}(${raw})` + (pass !== null ? ` vs ${target} — ${pass ? 'PASS ✓' : 'FAIL ✗'}` : '')
    send({ type: 'announcement', label: 'Roll', text })
  }

  const triggerRoll = (sides: number) => {
    if (rollMode === 'manual') {
      setManualSides(sides)
      setManualType('raw')
      setManualValue('')
      setManualInputOpen(true)
      return
    }

    setRolling(true)
    setTimeout(() => {
      const raw = Math.floor(Math.random() * sides) + 1
      resolve(raw, sides, false)
    }, 150)
  }

  const triggerWeaponAttack = () => {
    if (rollMode === 'manual') {
      setManualSides(20)
      setManualType('attack')
      setManualValue('')
      setManualInputOpen(true)
      return
    }

    setRolling(true)
    setTimeout(() => {
      const raw = Math.floor(Math.random() * 20) + 1
      resolveWeaponAttack(raw, false)
    }, 150)
  }

  const resolveWeaponAttack = (raw: number, isPhysical: boolean) => {
    if (!mainHand) return
    const total = raw + checkMod
    const target = floor.roomTarget
    const pass = total >= target
    
    setResult({ 
      raw, 
      sides: 20, 
      target, 
      pass, 
      isWeaponAttack: true, 
      isWeaponDamage: false, 
      isPhysical,
      total 
    })
    setRolling(false)

    const modParts = [`${statName}(${statMod >= 0 ? '+' : ''}${statMod})`]
    if (skillRank > 0) modParts.push(`Rank(${skillRank})`)
    const targetText = targetMob ? ` targeting **${targetMob.name}**` : ''
    const text = `[${character.crawlerName}] attacked ${isPhysical ? 'physically' : 'digitally'} with **${mainHand.name}**${targetText}: ${isPhysical ? 'physical' : 'd20'}(${raw}) + ${modParts.join('+')} = **${total}** vs Room Target ${target} — ${pass ? 'HIT ✓' : 'MISS ✗'}`
    send({ type: 'announcement', label: 'Combat', text })
  }

  const triggerWeaponDamage = () => {
    if (rollMode === 'manual') {
      setManualSides(effortDie)
      setManualType('damage')
      setManualValue('')
      setManualInputOpen(true)
      return
    }

    setRolling(true)
    setTimeout(() => {
      const raw = Math.floor(Math.random() * effortDie) + 1
      resolveWeaponDamage(raw, false)
    }, 150)
  }

  const resolveWeaponDamage = (raw: number, isPhysical: boolean) => {
    if (!mainHand) return
    const total = raw + statMod
    
    setResult({ 
      raw, 
      sides: effortDie, 
      target: null, 
      pass: null, 
      isWeaponAttack: false, 
      isWeaponDamage: true, 
      isPhysical,
      total 
    })
    setRolling(false)

    const targetText = targetMob ? ` targeting **${targetMob.name}**` : ''
    const text = `[${character.crawlerName}] rolled ${isPhysical ? 'physical' : 'digital'} damage for **${mainHand.name}**${targetText}: d${effortDie}(${raw}) + ${statName}(${statMod >= 0 ? '+' : ''}${statMod}) = **${total} ${isRanged ? 'Guns' : 'Weapon'} Effort** 💥`
    send({ type: 'announcement', label: 'Combat', text })
  }

  const submitManualRoll = () => {
    const raw = parseInt(manualValue, 10)
    if (isNaN(raw) || raw < 1 || raw > manualSides) return

    setManualInputOpen(false)

    if (manualType === 'raw') {
      resolve(raw, manualSides, true)
    } else if (manualType === 'attack') {
      resolveWeaponAttack(raw, true)
    } else if (manualType === 'damage') {
      resolveWeaponDamage(raw, true)
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-hud-panel border border-hud-border rounded-xl relative">
      
      {/* Dynamic Roll Mode Toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-hud-bg border border-hud-border/30 p-0.5 rounded select-none">
        <button
          onClick={() => { setRollMode('digital'); setManualInputOpen(false) }}
          className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase transition-colors leading-none py-1 ${
            rollMode === 'digital' ? 'bg-hud-accent text-hud-bg font-extrabold' : 'text-hud-muted hover:text-hud-text'
          }`}
        >
          🤖 DIGITAL
        </button>
        <button
          onClick={() => setRollMode('manual')}
          className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase transition-colors leading-none py-1 ${
            rollMode === 'manual' ? 'bg-hud-accent text-hud-bg font-extrabold' : 'text-hud-muted hover:text-hud-text'
          }`}
        >
          🎲 PHYSICAL
        </button>
      </div>

      <div className="font-hud text-xs text-hud-muted tracking-widest mb-4 uppercase">LATEST ACTION ROLL</div>
      
      <div className="font-hud text-7xl text-hud-accent font-bold leading-none mb-6" style={{ textShadow: '0 0 45px rgba(232, 169, 87, 0.45)' }}>
        {rolling ? '…' : (result ? result.total : '—')}
      </div>
      
      <div className="text-center mb-6 h-6">
        {rolling ? (
          <div className="font-hud text-xs text-hud-muted animate-pulse">Rolling virtual dice...</div>
        ) : result ? (
          <div className="text-center">
            {result.isWeaponAttack ? (
              <div className={`font-hud text-sm tracking-wider font-bold uppercase ${result.pass ? 'text-green-400' : 'text-red-400'}`}>
                {result.pass ? '🎯 HIT' : '✗ MISS'} ({result.isPhysical ? 'physical' : 'd20'} {result.raw} + {checkMod} vs {result.target})
              </div>
            ) : result.isWeaponDamage ? (
              <div className="font-hud text-sm text-amber-400 tracking-wider font-bold uppercase">
                💥 {result.total} {isRanged ? 'Guns' : 'Weapon'} Effort (rolled {result.isPhysical ? 'physical' : 'd' + result.sides} {result.raw} + {statMod})
              </div>
            ) : result.pass !== null ? (
              <div className={`font-hud text-sm tracking-wider font-bold uppercase ${result.pass ? 'text-green-400' : 'text-red-400'}`}>
                {result.pass ? '✓ PASS' : '✗ FAIL'} VS {result.target} ({result.isPhysical ? 'physical' : 'd20'} {result.raw} + {result.sides === 20 ? '0' : ''})
              </div>
            ) : (
              <div className="font-hud text-xs text-hud-muted">
                Rolled {result.isPhysical ? 'physical' : 'digital'} d{result.sides} (raw {result.raw})
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Manual Input Panel overlay (temporarily replaces controls when open) */}
      {manualInputOpen ? (
        <div className="w-full flex flex-col items-center gap-3 p-4 bg-hud-bg/80 border border-hud-accent/30 rounded-lg animate-fadeIn border-dashed">
          <div className="font-hud text-[9px] text-hud-accent tracking-widest uppercase font-bold text-center leading-none">
            🎲 ENTER PHYSICAL d{manualSides} DIE RESULT FOR {manualType === 'attack' ? 'ATTACK CHECK' : manualType === 'damage' ? 'DAMAGE/EFFORT' : 'ROLL'}:
          </div>
          <div className="flex gap-2 w-full justify-center mt-1">
            <input
              type="number"
              min={1}
              max={manualSides}
              value={manualValue}
              onChange={e => setManualValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') submitManualRoll()
                if (e.key === 'Escape') setManualInputOpen(false)
              }}
              placeholder={`1-${manualSides}`}
              className="w-24 text-center font-hud text-lg bg-hud-panel border border-hud-border text-hud-text px-2 py-1.5 rounded outline-none focus:border-hud-accent"
              autoFocus
            />
            <button
              onClick={submitManualRoll}
              className="font-hud text-[10px] border border-hud-accent text-hud-accent bg-hud-accent/15 px-4 py-1.5 hover:bg-hud-accent/35 rounded font-bold uppercase tracking-wider"
            >
              APPLY
            </button>
            <button
              onClick={() => setManualInputOpen(false)}
              className="font-hud text-[10px] border border-hud-border text-hud-muted px-4 py-1.5 hover:border-red-900 rounded uppercase font-bold"
            >
              CANCEL
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2.5 justify-center flex-wrap w-full border-b border-hud-border/20 pb-5 mb-5">
            {DICE.map(d => (
              <button key={d} onClick={() => triggerRoll(d)} disabled={rolling}
                className={`font-hud transition-all rounded-lg disabled:opacity-50 ${
                  d === 20 
                    ? 'border border-hud-accent text-hud-accent bg-hud-accent/10 px-5 py-3 text-base flex-1 min-w-[120px] font-bold tracking-wider' 
                    : 'border border-hud-border text-hud-text hover:border-hud-accent px-4 py-2.5 text-xs w-[68px]'
                }`}>
                {d === 20 ? (rollMode === 'manual' ? 'ENTER D20' : 'ROLL D20') : `${rollMode === 'manual' ? 'd' : 'd'}${d}`}
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

              {/* Target Selector and Range checks */}
              {floor.activeMobs && floor.activeMobs.length > 0 && (
                <div className="flex flex-col gap-1.5 bg-black/25 border border-hud-border/20 p-2.5 rounded">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-hud text-[9px] text-hud-muted tracking-widest uppercase">Target Threat:</span>
                    <select
                      value={targetMobId}
                      onChange={e => setTargetMobId(e.target.value)}
                      className="bg-hud-bg border border-hud-border/40 text-hud-text font-hud text-[10px] px-2 py-1 rounded outline-none focus:border-hud-accent"
                    >
                      <option value="">— No Target —</option>
                      {floor.activeMobs.map(m => (
                        <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  
                  {targetMob && (
                    <div className="flex items-center justify-between font-hud text-[9px] text-hud-muted border-t border-hud-border/10 pt-1.5 mt-1.5">
                      <span>DISTANCE:</span>
                      <span className={isOutOfRange ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                        {Math.round(targetDistance)}% ({isOutOfRange ? 'OUT OF RANGE ❌' : 'IN RANGE ✓'})
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-1">
                {/* Roll Attack Check Button */}
                <button
                  onClick={triggerWeaponAttack}
                  disabled={rolling || isOutOfRange}
                  className={`font-hud text-[10px] border rounded py-2 flex flex-col items-center justify-center gap-0.5 font-bold tracking-wider leading-none transition-all ${
                    isOutOfRange
                      ? 'border-red-900/50 text-red-500 bg-red-950/20 hover:bg-red-950/30 opacity-70 cursor-not-allowed'
                      : 'border-hud-accent text-hud-accent bg-hud-accent/15 hover:bg-hud-accent/30'
                  }`}
                >
                  <span>{isOutOfRange ? '❌ OUT OF RANGE' : rollMode === 'manual' ? '🎯 ENTER ATTACK' : '🎯 ROLL ATTACK'}</span>
                  <span className="text-[7.5px] font-normal opacity-70 leading-none mt-1">
                    d20 {checkMod >= 0 ? '+' : ''}{checkMod} ({statName} {statMod >= 0 ? '+' : ''}{statMod}{skillRank > 0 ? `, Lv${skillRank}` : ''})
                  </span>
                </button>

                {/* Roll Damage / Effort Button */}
                <button
                  onClick={triggerWeaponDamage}
                  disabled={rolling || isOutOfRange}
                  className={`font-hud text-[10px] border rounded py-2 flex flex-col items-center justify-center gap-0.5 font-bold tracking-wider leading-none transition-all ${
                    isOutOfRange
                      ? 'border-red-900/50 text-red-500 bg-red-950/20 hover:bg-red-950/30 opacity-70 cursor-not-allowed'
                      : 'border-amber-600 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40'
                  }`}
                >
                  <span>{isOutOfRange ? '❌ OUT OF RANGE' : rollMode === 'manual' ? '💥 ENTER DAMAGE' : '💥 ROLL DAMAGE'}</span>
                  <span className="text-[7.5px] font-normal opacity-70 leading-none mt-1">
                    d{effortDie} {statMod >= 0 ? '+' : ''}{statMod} ({statName} mod)
                  </span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}