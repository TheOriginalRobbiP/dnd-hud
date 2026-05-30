import { useState } from 'react'
import type { WSMessage } from '../../types'

interface GMDiceRollerProps {
  send: (msg: WSMessage) => void
}

const DICE = [4, 6, 8, 10, 12, 20, 100] as const

export function GMDiceRoller({ send }: GMDiceRollerProps) {
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<{ total: number; raw: number; sides: number; modifier: number; isPrivate: boolean; name: string } | null>(null)
  const [modifier, setModifier] = useState(0)
  const [rollName, setRollName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [rollMode, setRollMode] = useState<'digital' | 'manual'>('digital')
  const [manualInputOpen, setManualInputOpen] = useState(false)
  const [manualSides, setManualSides] = useState<number>(20)
  const [manualValue, setManualValue] = useState('')

  const triggerRoll = (sides: number) => {
    if (rollMode === 'manual') {
      setManualSides(sides)
      setManualValue('')
      setManualInputOpen(true)
      return
    }

    setRolling(true)
    setTimeout(() => {
      const raw = Math.floor(Math.random() * sides) + 1
      resolveRoll(raw, sides)
    }, 150)
  }

  const resolveRoll = (raw: number, sides: number) => {
    const total = raw + modifier
    const nameLabel = rollName.trim() ? ` for "${rollName.trim()}"` : ''
    
    setResult({
      total,
      raw,
      sides,
      modifier,
      isPrivate,
      name: rollName.trim()
    })
    setRolling(false)

    if (!isPrivate) {
      const modStr = modifier === 0 ? '' : modifier > 0 ? ` +${modifier}` : ` ${modifier}`
      const text = `[GM] rolled ${rollMode === 'manual' ? 'physical' : 'digital'} d${sides}(${raw})${modStr} = **${total}**${nameLabel} 🎲`
      send({ type: 'announcement', label: 'GM Roll', text })
    }
  }

  const submitManualRoll = () => {
    const raw = parseInt(manualValue, 10)
    if (isNaN(raw) || raw < 1 || raw > manualSides) return
    setManualInputOpen(false)
    resolveRoll(raw, manualSides)
  }

  return (
    <div className="border border-hud-border/40 p-3 bg-hud-panel/20 rounded">
      {/* Header */}
      <div className="flex justify-between items-center mb-2.5">
        <span className="font-hud text-[10px] text-hud-muted tracking-widest font-bold">🎲 GM QUICK ROLLER</span>
        
        <div className="flex items-center gap-1.5 bg-hud-bg border border-hud-border/20 p-0.5 rounded">
          <button
            onClick={() => setIsPrivate(false)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase transition-all leading-none ${
              !isPrivate ? 'bg-hud-accent text-hud-bg font-extrabold shadow-sm' : 'text-hud-muted hover:text-hud-text'
            }`}
          >
            📢 PUBLIC
          </button>
          <button
            onClick={() => setIsPrivate(true)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase transition-all leading-none ${
              isPrivate ? 'bg-red-800 text-hud-text font-extrabold border border-red-900/40 shadow-sm' : 'text-hud-muted hover:text-hud-text'
            }`}
          >
            🔒 BLIND/PRIV
          </button>
        </div>
      </div>

      {/* Input controls (Name & Modifier) */}
      <div className="flex gap-2 mb-2.5">
        <input
          value={rollName}
          onChange={e => setRollName(e.target.value)}
          placeholder="Roll label (e.g. Savage Bite)..."
          className="flex-1 bg-hud-bg border border-hud-border/30 text-hud-text font-hud text-[11px] px-2 py-1 outline-none focus:border-hud-accent/60 placeholder:text-hud-muted/50"
        />
        <div className="flex items-center border border-hud-border/30 rounded overflow-hidden flex-shrink-0 bg-hud-bg">
          <button
            onClick={() => setModifier(m => m - 1)}
            className="px-2 text-hud-muted hover:text-hud-accent bg-hud-panel/40 font-bold hover:bg-hud-panel text-xs"
          >
            -
          </button>
          <span className="px-2 font-mono text-xs font-bold text-hud-text w-8 text-center bg-hud-bg">
            {modifier >= 0 ? `+${modifier}` : modifier}
          </span>
          <button
            onClick={() => setModifier(m => m + 1)}
            className="px-2 text-hud-muted hover:text-hud-accent bg-hud-panel/40 font-bold hover:bg-hud-panel text-xs"
          >
            +
          </button>
        </div>
      </div>

      {/* Manual value input (overlay) */}
      {manualInputOpen ? (
        <div className="flex gap-1.5 items-center justify-center p-2 border border-dashed border-hud-accent/30 rounded bg-hud-bg/30">
          <span className="font-hud text-[9px] text-hud-accent uppercase font-bold mr-1 shrink-0">d{manualSides} ROLL:</span>
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
            className="w-16 text-center font-mono text-xs bg-hud-panel border border-hud-border text-hud-text px-1 py-1 rounded outline-none focus:border-hud-accent"
            autoFocus
          />
          <button
            onClick={submitManualRoll}
            className="font-hud text-[9px] border border-hud-accent text-hud-accent px-2.5 py-1 hover:bg-hud-accent/10 rounded font-bold uppercase"
          >
            OK
          </button>
          <button
            onClick={() => setManualInputOpen(false)}
            className="font-hud text-[9px] border border-hud-border text-hud-muted px-2.5 py-1 rounded hover:border-red-900 uppercase font-bold"
          >
            ✕
          </button>
        </div>
      ) : (
        /* Dice Grid and Result bar */
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 flex-wrap flex-1 max-w-[280px]">
            {DICE.map(d => (
              <button
                key={d}
                onClick={() => triggerRoll(d)}
                disabled={rolling}
                className={`font-hud border border-hud-border text-hud-text hover:border-hud-accent rounded-[3px] text-[10px] w-9 h-7 flex items-center justify-center transition-colors disabled:opacity-50`}
              >
                d{d}
              </button>
            ))}
          </div>

          <div className="flex-1 border-l border-hud-border/20 pl-2.5 flex flex-col items-center justify-center min-w-[75px] h-10">
            {rolling ? (
              <span className="text-hud-muted animate-pulse font-hud text-[10px]">ROLLING...</span>
            ) : result ? (
              <div className="text-center select-none leading-none">
                <div className="font-hud text-lg font-black text-hud-accent tracking-tighter leading-none">
                  {result.total}
                </div>
                <div className="font-hud text-[8px] text-hud-muted mt-1 leading-none">
                  d{result.sides}({result.raw}){result.modifier !== 0 ? (result.modifier > 0 ? `+${result.modifier}` : result.modifier) : ''}
                  {result.isPrivate && <span className="text-red-500 font-bold ml-1">🔒</span>}
                </div>
              </div>
            ) : (
              <span className="text-hud-muted/30 font-hud text-[10px]">READY</span>
            )}
          </div>
        </div>
      )}

      {/* Digital / Physical toggler button */}
      <div className="flex justify-between items-center mt-2 border-t border-hud-border/10 pt-1.5">
        <span className="font-hud text-[8px] text-hud-muted">
          {rollMode === 'digital' ? '🤖 AUTO DIGITAL ROLLS' : '🎲 ENTER PHYSICAL ROLLS'}
        </span>
        <button
          onClick={() => {
            const next = rollMode === 'digital' ? 'manual' : 'digital'
            setRollMode(next)
            setManualInputOpen(false)
          }}
          className="font-hud text-[8px] text-hud-accent/60 hover:text-hud-accent transition-colors font-bold uppercase tracking-wider"
        >
          {rollMode === 'digital' ? 'SWITCH TO PHYSICAL' : 'SWITCH TO DIGITAL'}
        </button>
      </div>
    </div>
  )
}
