import { useState } from 'react'
import type { Character, UserRole } from '../../types'
import { CrawlerWizard } from './CrawlerWizard'

interface RoleSelectorProps {
  characters: Character[]
  onSelect: (role: UserRole) => void
  onCharacterCreated?: () => void
}

type Stage =
  | { type: 'home' }
  | { type: 'slot'; slot: number }
  | { type: 'wizard'; slot: number }

const SLOT_LABELS = ['PLAYER 1', 'PLAYER 2', 'PLAYER 3', 'PLAYER 4']

export function RoleSelector({ characters, onSelect, onCharacterCreated }: RoleSelectorProps) {
  const [stage, setStage] = useState<Stage>({ type: 'home' })

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

  // ── Slot choice screen ───────────────────────────────────────
  if (stage.type === 'slot') {
    const slot = stage.slot
    const aliveChars = characters.filter(c => c.isAlive && !c.isActive)
    return (
      <div className="min-h-screen bg-hud-bg flex flex-col items-center justify-center p-8">
        <button
          onClick={() => setStage({ type: 'home' })}
          className="absolute top-6 left-6 font-hud text-hud-muted text-sm hover:text-hud-accent transition-colors"
        >
          ← BACK
        </button>

        <div className="mb-10 text-center">
          <div className="font-hud text-hud-muted text-xs tracking-widest mb-1">BORANT CORPORATION — CRAWLER REGISTRATION</div>
          <h2 className="font-hud text-2xl text-hud-accent tracking-widest">{SLOT_LABELS[slot - 1]}</h2>
          <p className="font-hud text-hud-muted text-sm mt-2 italic">
            "Choose how you enter the dungeon."
          </p>
        </div>

        <div className="w-72 flex flex-col gap-3">
          {/* Create your own */}
          <button
            onClick={() => setStage({ type: 'wizard', slot })}
            className="w-full py-5 border border-hud-accent text-hud-accent font-hud tracking-widest text-sm
                       hover:bg-hud-accent hover:text-hud-bg transition-colors duration-150 flex flex-col items-center gap-1"
          >
            <span className="text-base">⬡ CREATE YOUR OWN</span>
            <span className="text-xs text-hud-muted font-hud normal-case tracking-normal">
              Guided 6-step character creation
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-hud-border" />
            <span className="font-hud text-hud-muted text-xs tracking-widest">OR CHOOSE PRE-MADE</span>
            <div className="flex-1 h-px bg-hud-border" />
          </div>

          {/* Pre-made crawlers */}
          {aliveChars.length === 0 ? (
            <p className="font-hud text-hud-muted text-sm text-center w-72">
              No pre-made crawlers available.<br />
              <span className="text-xs italic opacity-60">The GM must seed characters first.</span>
            </p>
          ) : (
            aliveChars.map(char => (
              <button
                key={char.id}
                onClick={async () => {
                  // Activate the pre-gen if it isn't already
                  if (!char.isActive) {
                    await fetch(`/api/characters/${char.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isActive: true }),
                    })
                    onCharacterCreated?.() // triggers full_state_sync_request
                  }
                  onSelect(`player:${char.id}`)
                }}
                className="py-4 px-4 border border-hud-border font-hud text-left transition-colors duration-150
                           hover:border-hud-accent hover:text-hud-accent"
              >
                <div className="flex justify-between items-center">
                  <span className="tracking-wider text-hud-text">{char.crawlerName}</span>
                  <span className="text-xs text-hud-muted">{char.stats.CON} CON · {char.maxHp} HP</span>
                </div>
                {char.notes && (
                  <div className="text-xs text-hud-muted mt-1 truncate opacity-70">
                    {char.notes.split('.')[0]}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        <p className="font-hud text-hud-muted text-xs mt-12 opacity-40">
          Your choice remains private until you enter the dungeon.
        </p>
      </div>
    )
  }

  // ── Home screen ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-hud-bg flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="font-hud text-4xl text-hud-accent tracking-widest mb-2">
          THE HUD
        </h1>
        <p className="font-hud text-hud-muted text-base tracking-wider">
          DUNGEON CRAWLER CARL — COMPANION SYSTEM v1.0
        </p>
        <p className="font-hud text-hud-muted text-sm mt-1 italic">
          The audience is watching. Choose your role.
        </p>
      </div>

      {/* GM button */}
      <button
        onClick={() => onSelect('gm')}
        className="w-72 mb-4 py-4 border border-hud-accent text-hud-accent font-hud tracking-widest text-lg
                   hover:bg-hud-accent hover:text-hud-bg transition-colors duration-150"
      >
        GAME MASTER
      </button>

      {/* Divider */}
      <div className="w-72 flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-hud-border" />
        <span className="font-hud text-hud-muted text-sm tracking-widest">OR</span>
        <div className="flex-1 h-px bg-hud-border" />
      </div>

      {/* Player slots */}
      <div className="w-72 flex flex-col gap-2">
        {SLOT_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setStage({ type: 'slot', slot: i + 1 })}
            className="py-4 px-4 border border-hud-border font-hud text-left transition-colors duration-150
                       hover:border-hud-accent hover:text-hud-accent text-hud-text tracking-wider"
          >
            {label}
          </button>
        ))}
      </div>

      <p className="font-hud text-hud-muted text-sm mt-12 opacity-40">
        BORANT CORPORATION — SYNDICATE CRAWL v47.002.HUMAN
      </p>
    </div>
  )
}
