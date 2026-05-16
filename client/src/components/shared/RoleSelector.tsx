import { useState } from 'react'
import type { Character, UserRole } from '../../types'
import { CrawlerWizard } from './CrawlerWizard'
import { PREGENS } from '../../data/pregens'

interface RoleSelectorProps {
  characters: Character[]
  sessionActive: boolean
  onSelect: (role: UserRole) => void
  onCharacterCreated?: () => void
}

type Stage =
  | { type: 'home' }
  | { type: 'slot'; slot: number }
  | { type: 'pregen'; slot: number; pregenIdx: number }
  | { type: 'wizard'; slot: number }

const SLOT_LABELS = ['PLAYER 1', 'PLAYER 2', 'PLAYER 3', 'PLAYER 4']

export function RoleSelector({ characters, sessionActive, onSelect, onCharacterCreated }: RoleSelectorProps) {
  const [stage, setStage] = useState<Stage>({ type: 'home' })
  const [playerName, setPlayerName] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Wizard ───────────────────────────────────────────────────
  if (stage.type === 'wizard') {
    return (
      <CrawlerWizard
        onClose={() => setStage({ type: 'slot', slot: stage.slot })}
        onComplete={(created) => {
          onCharacterCreated?.()
          onSelect(`player:${created.id}`)
        }}
      />
    )
  }

  // ── Pre-gen confirm screen ───────────────────────────────────
  if (stage.type === 'pregen') {
    const pregen = PREGENS[stage.pregenIdx]
    const canConfirm = playerName.trim().length > 0 && !saving

    const handleConfirm = async () => {
      if (!canConfirm) return
      setSaving(true)
      try {
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crawlerName: pregen.crawlerName,
            playerName: playerName.trim(),
            portrait: pregen.portrait,
            hp: pregen.maxHp,
            maxHp: pregen.maxHp,
            mp: pregen.maxMp,
            maxMp: pregen.maxMp,
            stats: pregen.stats,
            skills: pregen.skills.map(s => ({ ...s, id: crypto.randomUUID(), description: '' })),
            viewerCount: 500,
            notes: pregen.notes,
          }),
        })
        if (!res.ok) throw new Error('Server error')
        const created = await res.json()
        await new Promise(r => setTimeout(r, 800))
        onCharacterCreated?.()
        onSelect(`player:${created.id}`)
      } catch {
        setSaving(false)
      }
    }

    return (
      <div className="min-h-screen bg-hud-bg flex flex-col items-center justify-center p-8">
        <button
          onClick={() => { setStage({ type: 'slot', slot: stage.slot }); setPlayerName('') }}
          className="absolute top-6 left-6 font-hud text-hud-muted text-sm hover:text-hud-accent transition-colors"
        >
          ← BACK
        </button>

        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          {/* Portrait */}
          <div className="w-48 border-2 border-hud-accent overflow-hidden">
            <img src={pregen.portrait} alt={pregen.crawlerName} className="w-full object-cover object-top" />
          </div>

          {/* Identity */}
          <div className="text-center">
            <div className="font-hud text-2xl text-hud-accent tracking-widest">{pregen.crawlerName}</div>
            <div className="font-hud text-xs text-hud-muted italic mt-1">"{pregen.tagline}"</div>
            <div className="font-hud text-xs text-hud-muted mt-2 opacity-60">{pregen.preJob}</div>
          </div>

          {/* Stats preview */}
          <div className="w-full border border-hud-border p-3 grid grid-cols-5 gap-2 text-center">
            {(['STR', 'DEX', 'CON', 'INT', 'CHA'] as const).map(s => (
              <div key={s}>
                <div className="font-hud text-[10px] text-hud-muted">{s}</div>
                <div className="font-hud text-hud-accent text-lg">{pregen.stats[s]}</div>
              </div>
            ))}
          </div>

          {/* Skills preview */}
          <div className="w-full border border-hud-border p-3">
            <div className="font-hud text-[10px] text-hud-muted tracking-wider mb-2">STARTING SKILLS</div>
            <div className="flex flex-wrap gap-1">
              {pregen.skills.map(sk => (
                <span key={sk.name} className="font-hud text-[10px] border border-hud-border text-hud-muted px-2 py-0.5">
                  {sk.name} {sk.level}
                </span>
              ))}
            </div>
          </div>

          {/* Player name input */}
          <div className="w-full">
            <div className="font-hud text-xs text-hud-muted tracking-wider mb-1">YOUR NAME (PLAYER)</div>
            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              placeholder="e.g. Rob"
              autoFocus
              className="w-full bg-hud-bg border border-hud-border text-hud-text font-hud text-sm p-3 focus:border-hud-accent outline-none"
            />
          </div>

          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full py-4 border border-hud-accent text-hud-accent font-hud tracking-widest text-sm
                       hover:bg-hud-accent hover:text-hud-bg transition-colors disabled:opacity-30 disabled:border-hud-border disabled:text-hud-muted"
          >
            {saving ? 'ENTERING DUNGEON...' : `⬇ ENTER AS ${pregen.crawlerName}`}
          </button>
        </div>
      </div>
    )
  }

  // ── Slot choice screen ───────────────────────────────────────
  if (stage.type === 'slot') {
    const slot = stage.slot
    return (
      <div className="min-h-screen bg-hud-bg flex flex-col items-center justify-center p-6">
        <button
          onClick={() => setStage({ type: 'home' })}
          className="absolute top-6 left-6 font-hud text-hud-muted text-sm hover:text-hud-accent transition-colors"
        >
          ← BACK
        </button>

        <div className="mb-8 text-center">
          <div className="font-hud text-hud-muted text-xs tracking-widest mb-1">BORANT CORPORATION — CRAWLER REGISTRATION</div>
          <h2 className="font-hud text-2xl text-hud-accent tracking-widest">{SLOT_LABELS[slot - 1]}</h2>
          <p className="font-hud text-hud-muted text-sm mt-2 italic">"Choose how you enter the dungeon."</p>
        </div>

        {/* Pre-gen portrait grid */}
        <div className="w-full max-w-lg mb-6">
          <div className="font-hud text-xs text-hud-muted tracking-wider mb-3 text-center">SELECT A PRE-GENERATED CRAWLER</div>
          <div className="grid grid-cols-4 gap-2">
            {PREGENS.map((p, i) => (
              <button
                key={p.crawlerName}
                onClick={() => { setPlayerName(''); setStage({ type: 'pregen', slot, pregenIdx: i }) }}
                className="relative border border-hud-border hover:border-hud-accent transition-colors overflow-hidden group"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img src={p.portrait} alt={p.crawlerName} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-200" />
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-hud-bg/85 py-1 font-hud text-[10px] tracking-wider text-center text-hud-muted group-hover:text-hud-accent transition-colors">
                  {p.crawlerName}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full max-w-lg mb-6">
          <div className="flex-1 h-px bg-hud-border" />
          <span className="font-hud text-hud-muted text-xs tracking-widest">OR</span>
          <div className="flex-1 h-px bg-hud-border" />
        </div>

        {/* Create your own */}
        <button
          onClick={() => setStage({ type: 'wizard', slot })}
          className="w-full max-w-lg py-4 border border-hud-accent text-hud-accent font-hud tracking-widest text-sm
                     hover:bg-hud-accent hover:text-hud-bg transition-colors flex flex-col items-center gap-1"
        >
          <span>⬡ CREATE YOUR OWN</span>
          <span className="text-xs text-hud-muted font-hud normal-case tracking-normal group-hover:text-hud-bg">
            Guided 7-step character creation
          </span>
        </button>

        <p className="font-hud text-hud-muted text-xs mt-10 opacity-40">
          Your choice remains private until you enter the dungeon.
        </p>
      </div>
    )
  }

  // ── Home screen ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-hud-bg flex flex-col items-center justify-center p-8">
      <div className="mb-12 text-center">
        <h1 className="font-hud text-4xl text-hud-accent tracking-widest mb-2">THE HUD</h1>
        <p className="font-hud text-hud-muted text-base tracking-wider">DUNGEON CRAWLER CARL — COMPANION SYSTEM v1.0</p>
        <p className="font-hud text-hud-muted text-sm mt-1 italic">The audience is watching. Choose your role.</p>
      </div>

      <button
        onClick={() => onSelect('gm')}
        className="w-full max-w-xs mb-4 py-4 border border-hud-accent bg-hud-panel text-hud-accent font-hud tracking-widest text-lg
                   hover:bg-hud-accent hover:text-hud-bg transition-colors flex items-center justify-center gap-2"
      >
        GAME MASTER
        <span className="text-[10px] border border-current px-1 py-0.5 leading-none flex items-center">🔒 GM</span>
      </button>

      <div className="w-full max-w-xs flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-hud-border" />
        <span className="font-hud text-hud-muted text-sm tracking-widest">OR</span>
        <div className="flex-1 h-px bg-hud-border" />
      </div>

      <div className="w-full max-w-xs flex flex-col gap-2">
        {SLOT_LABELS.map((label, i) => {
          const char = characters[i]
          const isDisabled = !sessionActive
          return (
            <button
              key={i}
              onClick={() => !isDisabled && setStage({ type: 'slot', slot: i + 1 })}
              disabled={isDisabled}
              className={`py-3 px-4 border font-hud text-left transition-colors flex flex-col ${
                isDisabled
                  ? 'border-hud-border text-hud-muted opacity-40 cursor-not-allowed'
                  : 'border-hud-border hover:border-hud-accent hover:text-hud-accent text-hud-text'
              } tracking-wider`}
            >
              <span>{label}</span>
              {char && char.isActive ? (
                <span className="text-xs text-hud-muted mt-1">{char.crawlerName} {!char.isAlive && '☠'}</span>
              ) : (
                <span className="text-xs text-hud-muted italic mt-1">VACANT</span>
              )}
            </button>
          )
        })}
        {!sessionActive && (
          <p className="font-hud text-xs text-hud-muted italic text-center mt-2 opacity-60">
            Waiting for GM to start the session...
          </p>
        )}
      </div>

      <p className="font-hud text-hud-muted text-sm mt-12 opacity-40">
        BORANT CORPORATION — SYNDICATE CRAWL v47.002.HUMAN
      </p>
    </div>
  )
}
