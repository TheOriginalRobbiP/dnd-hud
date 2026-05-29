import type { Character } from '../../types'
import { getCrawlerPortrait } from '../../utils/portraits'

interface SavedCrawlerLibraryProps {
  characters: Character[]
  onSelect: (character: Character) => void
  onCancel: () => void
}

export function SavedCrawlerLibrary({ characters, onSelect, onCancel }: SavedCrawlerLibraryProps) {
  // Filter for characters that are not currently slotted
  const savedCrawlers = characters.filter((c) => c.slot === null || c.slot === undefined)

  return (
    <div className="bg-hud-panel border border-hud-border rounded-xl p-6 w-full max-w-lg flex flex-col overflow-hidden max-h-[80vh]">
      {/* Header */}
      <div className="border-b border-hud-border pb-3 mb-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="font-hud text-base text-hud-accent tracking-widest font-bold uppercase">📁 CRAWLER RECONSTRUCTION</h3>
          <p className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mt-1">
            BORANT ARCHIVED CRAWLER BANK
          </p>
        </div>
        <button
          onClick={onCancel}
          className="font-hud text-[10px] border border-hud-border text-hud-muted px-2.5 py-1 hover:border-red-800 hover:text-red-400 transition-colors uppercase rounded"
        >
          ✕ CANCEL
        </button>
      </div>

      {/* Library Grid */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {savedCrawlers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-hud-border/40 rounded-lg">
            <p className="font-hud text-xs text-hud-muted italic">No archived crawlers found in this sector's database.</p>
            <p className="font-hud text-[10px] text-hud-muted/50 mt-1 uppercase">Use the Wizard to construct a fresh soul from scratch.</p>
          </div>
        ) : (
          savedCrawlers.map((c) => {
            const portrait = getCrawlerPortrait(c.crawlerName, c.portrait)
            return (
              <div
                key={c.id}
                className="border border-hud-border/60 bg-hud-bg/30 p-3 rounded-lg flex gap-4 hover:border-hud-accent/60 transition-colors group relative"
              >
                {/* Portrait - smaller, fully visible and not cut off */}
                <div className="w-16 h-22 border border-hud-border overflow-hidden relative bg-black/40 flex-shrink-0 rounded-md">
                  {portrait ? (
                    <img
                      src={portrait}
                      alt={c.crawlerName}
                      className="w-full h-full object-contain object-center opacity-85 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-hud text-2xl text-hud-muted">?</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-hud text-sm text-hud-accent tracking-widest font-extrabold uppercase truncate">
                        {c.crawlerName}
                      </span>
                      <span className="font-hud text-[9px] text-hud-muted bg-hud-panel px-1.5 py-0.5 border border-hud-border/20 rounded">
                        LVL 2 {c.class || 'CRAWLER'}
                      </span>
                    </div>
                    <div className="font-hud text-[11px] text-hud-muted mt-0.5">Player: {c.playerName}</div>
                  </div>

                  {/* Core stats preview */}
                  <div className="flex gap-2 text-[10px] font-mono opacity-80 mt-1 text-hud-muted">
                    <span>HP {c.hp}/{c.maxHp}</span>
                    <span>·</span>
                    <span>MP {c.mp}/{c.maxMp}</span>
                    <span>·</span>
                    <span className="text-yellow-500">⚡ {c.aiFavour}</span>
                  </div>

                  {/* Import Button */}
                  <button
                    onClick={() => onSelect(c)}
                    className="mt-2 w-full py-1.5 border border-hud-accent/40 hover:border-hud-accent bg-hud-accent/5 hover:bg-hud-accent text-hud-accent hover:text-hud-bg font-hud tracking-widest text-[10px] uppercase transition-all rounded"
                  >
                    🚀 RESTORE CRAWLER
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
