import type { Character } from '../../types'
import { ViewerCounter } from './ViewerCounter'
import { AchievementLog } from './AchievementLog'

export function FameTab({ character, floorNumber }: { character: Character; floorNumber: number }) {
  return (
    <div className="p-4 flex flex-col gap-6">
      <ViewerCounter viewerCount={character.viewerCount} />

      <div>
        <div className="font-hud text-sm text-hud-muted tracking-widest border-b border-hud-border pb-1 mb-3">ACHIEVEMENTS</div>
        <AchievementLog achievements={character.achievements as any} />
      </div>

      <div>
        <div className="font-hud text-sm text-hud-muted tracking-widest border-b border-hud-border pb-1 mb-3">SPONSOR SLOTS</div>
        {floorNumber < 4
          ? <div className="border border-hud-border p-4 text-center">
              <div className="text-2xl mb-2">🔒</div>
              <div className="font-hud text-sm text-hud-muted tracking-wider">SPONSOR SLOTS LOCKED</div>
              <div className="font-hud text-sm text-hud-muted mt-2 italic">
                Sponsors unlock on Floor 4.<br />Keep surviving. Keep entertaining.
              </div>
            </div>
          : <p className="font-hud text-sm text-hud-muted italic">No active sponsors.</p>
        }
      </div>
    </div>
  )
}
