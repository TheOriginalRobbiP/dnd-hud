
export function RulesTab() {
  return (
    <div className="flex flex-col h-full bg-hud-bg text-hud-text font-hud overflow-y-auto p-4 space-y-6">
      
      {/* 1. THE TARGET */}
      <section className="border-b border-hud-border pb-4">
        <h2 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-2">The Target</h2>
        <div className="text-sm space-y-2 bg-hud-panel p-3 border border-hud-border">
          <p>Single number set by GM for the room.</p>
          <p>Roll <span className="text-hud-accent">D20 + STAT</span>. Meet or beat to succeed.</p>
          <div className="flex flex-col gap-1 mt-2 text-xs text-hud-muted">
            <div className="flex justify-between"><span>EASY</span> <span>TARGET - 3</span></div>
            <div className="flex justify-between"><span>HARD</span> <span>TARGET + 3</span></div>
          </div>
        </div>
      </section>

      {/* 2. STATS */}
      <section className="border-b border-hud-border pb-4">
        <h2 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-2">Stats</h2>
        <div className="text-xs space-y-1 bg-hud-panel p-3 border border-hud-border">
          <div className="flex justify-between">
            <span className="text-hud-accent">STR</span>
            <span className="text-hud-muted">Melee / Muscle</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-accent">DEX</span>
            <span className="text-hud-muted">Ranged / Nimble</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-accent">CON</span>
            <span className="text-hud-muted">Tough / Recover</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-accent">INT</span>
            <span className="text-hud-muted">Knowledge / Magic</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-accent">WIS</span>
            <span className="text-hud-muted">Perception / Healing</span>
          </div>
          <div className="flex justify-between">
            <span className="text-hud-accent">CHA</span>
            <span className="text-hud-muted">Persuasion / Social</span>
          </div>
          <div className="mt-2 pt-2 border-t border-hud-border text-hud-muted text-[10px] text-center">
            EACH ADDS TO D20 ROLLS
          </div>
        </div>
      </section>

      {/* 3. EFFORT DICE */}
      <section className="border-b border-hud-border pb-4">
        <h2 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-2">Effort Dice</h2>
        <div className="bg-hud-panel p-3 border border-hud-border">
          <p className="text-[10px] text-hud-muted mb-3 border-b border-hud-border pb-2">ROLLED AFTER SUCCESSFUL ATTEMPT</p>
          <div className="text-xs space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-6 text-blue-400 font-bold">D4</span>
              <div className="flex flex-col">
                <span className="text-hud-accent">BASIC</span>
                <span className="text-[10px] text-hud-muted">Bare hands / wits</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-green-400 font-bold">D6</span>
              <div className="flex flex-col">
                <span className="text-hud-accent">WEAPON & TOOLS</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-yellow-400 font-bold">D8</span>
              <div className="flex flex-col">
                <span className="text-hud-accent">GUNS</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 text-purple-400 font-bold">D10</span>
              <div className="flex flex-col">
                <span className="text-hud-accent">MAGIC & ENERGY</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-hud-border">
              <span className="w-6 text-red-400 font-bold">D12</span>
              <div className="flex flex-col">
                <span className="text-hud-accent">ULTIMATE (NAT 20!)</span>
                <span className="text-[10px] text-hud-muted">Roll type above + D12</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HEARTS */}
      <section className="border-b border-hud-border pb-4">
        <h2 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-2">Hearts</h2>
        <div className="bg-hud-panel p-3 border border-hud-border text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-lg">♥</span>
            <span className="text-hud-accent">1 HEART</span>
          </div>
          <span className="text-hud-muted">= 10 HP / EFFORT</span>
        </div>
        <p className="text-[10px] text-hud-muted mt-2 uppercase">Enemy HP shown in hearts.</p>
      </section>

      {/* 5. MOVEMENT */}
      <section className="border-b border-hud-border pb-4">
        <h2 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-2">Movement</h2>
        <div className="bg-hud-panel p-3 border border-hud-border text-xs space-y-2">
          <div className="flex flex-col">
            <span className="text-hud-accent">CLOSE</span>
            <span className="text-hud-muted text-[10px]">Arm's reach (free)</span>
          </div>
          <div className="flex flex-col">
            <span className="text-hud-accent">NEAR</span>
            <span className="text-hud-muted text-[10px]">Few steps (can act same turn)</span>
          </div>
          <div className="flex flex-col">
            <span className="text-hud-accent">FAR</span>
            <span className="text-hud-muted text-[10px]">Full turn to move (no action)</span>
          </div>
          <div className="flex flex-col">
            <span className="text-hud-accent">OUT OF RANGE</span>
            <span className="text-hud-muted text-[10px]">Can't reach</span>
          </div>
        </div>
      </section>

      {/* 6. TIME */}
      <section className="border-b border-hud-border pb-4">
        <h2 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-2">Time</h2>
        <div className="bg-hud-panel p-3 border border-hud-border text-xs space-y-2">
          <div className="flex justify-between items-center border-b border-hud-border pb-2">
            <span className="text-hud-accent">TURN</span>
            <span className="text-hud-muted text-[10px] text-right">10-20 sec<br/>Your moment to act</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-hud-accent">ROUND</span>
            <span className="text-hud-muted text-[10px] text-right">~1 min<br/>Everyone has gone once</span>
          </div>
        </div>
      </section>

      {/* 7. DEATH & RECOVERY */}
      <section className="border-b border-hud-border pb-4">
        <h2 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-2">Death & Recovery</h2>
        <div className="bg-hud-panel p-3 border border-hud-border text-xs space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-red-400">0 HP: UNCONSCIOUS</span>
            <span className="text-[10px] text-hud-muted">Roll <span className="text-blue-400">D4</span> — die in that many ROUNDS.</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-hud-accent">DYING TURN</span>
            <span className="text-[10px] text-hud-muted">Roll D20. Nat 20 = MIRACLE (back at 1 HP).</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-hud-accent">ALLY STABILISE</span>
            <span className="text-[10px] text-hud-muted">Touch + INT/WIS vs TARGET = stops dying timer.</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-hud-accent">RECOVER ACTION</span>
            <span className="text-[10px] text-hud-muted">Sacrifice turn. Roll D20+CON vs TARGET. Regain CON+1 HP.</span>
          </div>
          <div className="flex flex-col gap-1 pt-2 border-t border-hud-border">
            <span className="text-red-500">-20 HP: BLOWN TO BITS</span>
            <span className="text-[10px] text-hud-muted">Gone. Forever.</span>
          </div>
        </div>
      </section>

      {/* 8. DCC SPECIFICS */}
      <section className="pb-4">
        <h2 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-2">DCC Mechanics</h2>
        <div className="bg-hud-panel p-3 border border-hud-border text-xs space-y-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-hud-accent">AI FAVOUR</span>
              <span className="text-yellow-400">⚡</span>
            </div>
            <span className="text-[10px] text-hud-muted">Granted by GM for creative play. Works like Hero Coin — spend to re-roll, OR add <span className="text-red-400">D12</span>. Give it to an ally. Max 1 at a time.</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-hud-accent">VIEWER COUNT</span>
            <span className="text-[10px] text-hud-muted">Your fame. High viewers = better sponsor deals.</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-hud-accent">SPONSORS</span>
            <span className="text-[10px] text-hud-muted">Up to 3, unlocked Floor 4/5/6. Send messages via HUD Sponsorship tab.</span>
          </div>
        </div>
      </section>
      
    </div>
  );
}
