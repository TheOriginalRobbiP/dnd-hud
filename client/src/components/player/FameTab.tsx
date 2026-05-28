import type { Character } from '../../types'
import { AchievementLog } from './AchievementLog'

export function FameTab({ character, floorNumber, locked = false }: { character: Character; floorNumber: number; locked?: boolean }) {
  return (
    <div className="relative overflow-hidden min-h-[200px]">
      <div className={`p-4 flex flex-col gap-6 ${locked ? 'opacity-20 pointer-events-none' : ''}`}>
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

      {locked && (
        <div className="absolute inset-0 bg-[#0d0d0f]/95 border border-red-900/40 rounded-xl flex flex-col items-center justify-center gap-1.5 p-6 select-none z-10 text-center animate-pulse">
          <span className="text-red-500 text-3xl leading-none">🔒</span>
          <span className="font-hud text-base text-red-500 font-extrabold tracking-widest uppercase leading-none mt-2">FAME CHANNELS LOCKED</span>
          <span className="font-hud text-xs text-hud-muted tracking-wider uppercase mt-1 max-w-[280px] leading-relaxed">
            SPONSORSHIP MODULES AND ACHIEVEMENT ACCRUALS ARE TEMPORARILY DISABLED BY THE SYSTEM AI. 
          </span>
          <span className="font-hud text-[10px] text-hud-accent/60 mt-1 max-w-[240px] leading-relaxed">
            REQUISITE: COMPLETE THE TUTORIAL TO ENROLL IN THE SYNDICATE NETWORK.
          </span>
        </div>
      )}
    </div>
  )
}
