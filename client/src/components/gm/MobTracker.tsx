import { effortColour } from '../../utils/colours'
import { BestiaryPicker } from './BestiaryPicker'
import { useState } from 'react'
import type { Mob, WSMessage } from '../../types'


interface MobTrackerProps {
  mobs: Mob[]
  currentFloor: number
  send: (msg: WSMessage) => void
}

export function MobTracker({ mobs, currentFloor, send }: MobTrackerProps) {
  const [adding, setAdding] = useState(false)
  const [showBestiary, setShowBestiary] = useState(false)
  const [name, setName] = useState('')
  const [maxHp, setMaxHp] = useState('10')
  const [effort, setEffort] = useState<'basic'|'weapon'|'magic'>('basic')

  const addMob = () => {
    if (!name.trim()) return
    send({ type: 'mob_add', mob: {
      id: crypto.randomUUID(), name: name.trim(),
      hp: parseInt(maxHp) || 10, maxHp: parseInt(maxHp) || 10,
      effortType: effort, notes: ''
    }})
    setName(''); setMaxHp('10'); setAdding(false)
  }

  const adjustHp = (mob: Mob, delta: number) => {
    send({ type: 'mob_hp_update', mobId: mob.id, hp: Math.max(0, mob.hp + delta) })
  }

  return (
    <div className="border border-hud-border p-3">
      <div className="flex justify-between items-center mb-3">
        <div className="font-hud text-sm text-hud-muted tracking-widest">MOB TRACKER</div>
        <button onClick={() => setAdding(a => !a)}
          className="font-hud text-sm border border-hud-border text-hud-muted px-2 py-1 hover:border-red-700 hover:text-red-400 transition-colors">
          + ADD MOB
        </button>
      </div>

      {adding && (
        <div className="flex flex-col gap-2 mb-3 border border-hud-border p-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Mob name..."
            className="bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-1 outline-none focus:border-hud-accent" />
          <div className="flex gap-2">
            <input value={maxHp} onChange={e => setMaxHp(e.target.value)} type="number" placeholder="HP"
              className="w-16 bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-1 outline-none focus:border-hud-accent" />
            {(['basic','weapon','magic'] as const).map(e => (
              <button key={e} onClick={() => setEffort(e)}
                className="px-2 py-1 font-hud text-sm border transition-colors"
                style={{ borderColor: effort === e ? effortColour(e) : '#1e1e2e', color: effort === e ? effortColour(e) : '#64748b' }}>
                {e.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={addMob}
            className="border border-red-900 text-red-400 font-hud text-sm py-1 hover:border-red-600 transition-colors">
            SPAWN MOB
          </button>
        </div>
      )}

      {mobs.length === 0
        ? <p className="font-hud text-sm text-hud-muted italic">No active mobs.</p>
        : <div className="flex flex-col gap-2">
            {mobs.map(mob => {
              const pct = mob.maxHp > 0 ? mob.hp / mob.maxHp : 0
              const dead = mob.hp <= 0
              const hpCol = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444'
              return (
                <div key={mob.id} className={`border border-hud-border p-2 transition-opacity ${dead ? 'opacity-30' : ''}`}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-hud text-sm text-hud-text">{mob.name}</span>
                      <span className="font-hud text-sm px-1 border"
                        style={{ borderColor: effortColour(mob.effortType), color: effortColour(mob.effortType) }}>
                        {mob.effortType.toUpperCase()}
                      </span>
                      {dead && <span className="font-hud text-sm text-red-500">DEAD</span>}
                    </div>
                    <button onClick={() => send({ type: 'mob_remove', mobId: mob.id })}
                      className="font-hud text-sm text-hud-muted hover:text-red-400 transition-colors">✕</button>
                  </div>
                  <div className="w-full h-1.5 bg-hud-border mb-1">
                    <div className="h-full transition-all duration-300" style={{ width: `${pct*100}%`, backgroundColor: hpCol }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-hud text-sm text-hud-muted">{mob.hp}/{mob.maxHp}</span>
                    <div className="flex gap-1 ml-auto">
                      {[-5,-1,1,5].map(d => (
                        <button key={d} onClick={() => adjustHp(mob, d)}
                          className="border border-hud-border font-hud text-sm px-1.5 py-0.5 hover:border-hud-accent hover:text-hud-accent transition-colors text-hud-muted">
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
      }
      {showBestiary && (
        <BestiaryPicker
          currentFloor={currentFloor}
          onClose={() => setShowBestiary(false)}
          onSpawn={(mob) => {
            send({ type: 'mob_add', mob: { id: crypto.randomUUID(), ...mob, effortType: mob.effortType as 'basic' | 'weapon' | 'magic' } })
          }}
        />
      )}
    </div>
  )
}
