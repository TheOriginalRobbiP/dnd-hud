import { effortColour } from '../../utils/colours'
import { BestiaryPicker } from './BestiaryPicker'
import { useState } from 'react'
import type { Mob, WSMessage, FloorState } from '../../types'


interface MobTrackerProps {
  floor: FloorState
  send: (msg: WSMessage) => void
}

export function MobTracker({ floor, send }: MobTrackerProps) {
  const { activeMobs: mobs, floorNumber: currentFloor, bonePile, currentRoomData } = floor
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

      {/* Bone Harvest Trigger (Sector 8 & Bone Pile Available) */}
      {currentRoomData?.roomName?.includes('Subway Platform') && bonePile && bonePile.length > 0 && (
        <div className="mb-4 border border-red-700 bg-red-950/20 p-2 text-center rounded-[2px] shadow-lg">
          <div className="font-hud text-[9px] text-red-400 font-bold tracking-widest mb-1">BONE COLLECTION COMPLETE</div>
          <button 
            onClick={() => send({ type: 'bone_harvest_trigger' })}
            className="w-full font-hud text-xs bg-red-700 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded transition-all shadow-md animate-pulse"
          >
            💀 TRIGGER BONE HARVEST ({bonePile.length} MINIONS) 💀
          </button>
        </div>
      )}

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
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-hud text-lg text-hud-text font-bold">{mob.name}</span>
                      <span className="font-hud text-xs px-1 border"
                        style={{ borderColor: effortColour(mob.effortType), color: effortColour(mob.effortType) }}>
                        {mob.effortType.toUpperCase()}
                      </span>
                      {dead && <span className="font-hud text-sm text-red-500">DEAD</span>}
                    </div>
                    <button onClick={() => send({ type: 'mob_remove', mobId: mob.id })}
                      className="font-hud text-sm text-hud-muted hover:text-red-400 transition-colors">✕</button>
                  </div>
                  
                  {/* Full width Boss HP bar (V2 Design) */}
                  <div className="w-full h-8 bg-hud-panel border border-hud-border rounded overflow-hidden relative mb-3">
                    <div className="h-full transition-all duration-300" style={{ width: `${pct*100}%`, backgroundColor: hpCol }} />
                    <div className="absolute inset-0 flex items-center justify-center font-hud text-xs md:text-sm font-bold text-white gap-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                      <span>{mob.hp} / {mob.maxHp} HP</span>
                      <span className="text-red-500">{'❤️'.repeat(Math.floor(mob.hp / 10)) + (mob.hp % 10 >= 5 ? '💔' : '')}</span>
                      <span className="opacity-80">({(mob.hp / 10).toFixed(1)} ❤️)</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {[-5,-1,1,5].map(d => (
                      <button key={d} onClick={() => adjustHp(mob, d)}
                        className={`flex-1 border font-hud text-base py-2 rounded transition-colors font-bold ${
                          d < 0 ? 'border-red-900/50 text-red-400 bg-hud-bg hover:bg-red-900/20' : 'border-hud-border text-hud-text bg-hud-bg hover:border-hud-accent'
                        }`}>
                        {d > 0 ? `+${d}` : d}
                      </button>
                    ))}
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
