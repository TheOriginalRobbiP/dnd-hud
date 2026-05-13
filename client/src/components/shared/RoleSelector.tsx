import type { Character, UserRole } from '../../types'

interface RoleSelectorProps {
  characters: Character[]
  onSelect: (role: UserRole) => void
}

export function RoleSelector({ characters, onSelect }: RoleSelectorProps) {
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

      {/* Player character list */}
      {characters.length === 0 ? (
        <p className="font-hud text-hud-muted text-sm text-center w-72">
          No crawlers registered yet.<br />
          <span className="text-sm italic opacity-60">The GM must create characters first.</span>
        </p>
      ) : (
        <div className="w-72 flex flex-col gap-2">
          {characters.map(char => (
            <button
              key={char.id}
              onClick={() => onSelect(`player:${char.id}`)}
              className={`py-4 px-4 border font-hud text-left transition-colors duration-150 ${
                char.isAlive
                  ? 'border-hud-border text-hud-text hover:border-hud-accent hover:text-hud-accent'
                  : 'border-red-900 text-red-700 cursor-default'
              }`}
            >
              <span className="tracking-wider">{char.crawlerName}</span>
              <span className="text-hud-muted ml-2">/ {char.playerName}</span>
              {!char.isAlive && (
                <span className="ml-2 text-red-700 text-sm">☠ DECEASED</span>
              )}
            </button>
          ))}
        </div>
      )}

      <p className="font-hud text-hud-muted text-sm mt-12 opacity-40">
        BORANT CORPORATION — SYNDICATE CRAWL v47.002.HUMAN
      </p>
    </div>
  )
}
