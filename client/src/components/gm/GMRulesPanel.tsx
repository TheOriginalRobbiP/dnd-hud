import React from 'react';

export function GMRulesPanel() {
  return (
    <div className="flex flex-col h-full bg-hud-panel border border-hud-border font-hud text-hud-text overflow-hidden">
      <div className="p-2 border-b border-hud-border bg-hud-bg flex justify-between items-center">
        <h2 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase">GM Rules Reference</h2>
      </div>
      
      <div className="p-3 overflow-y-auto space-y-4 text-xs flex-1">
        
        {/* 1. SETTING THE TARGET */}
        <section className="space-y-1">
          <h3 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-1">1. Setting The Target</h3>
          <p>Between 10-18. One number for whole room/scene.</p>
          <ul className="list-disc list-inside ml-1 text-hud-muted">
            <li><span className="text-hud-text">Easy scenes:</span> 10-12</li>
            <li><span className="text-hud-text">Standard:</span> 13-15</li>
            <li><span className="text-hud-text">Brutal:</span> 16-18</li>
          </ul>
          <p className="mt-1"><span className="text-hud-accent">ESCALATE:</span> Move die to higher number when players move to harder area, weather changes, or area spell is cast.</p>
        </section>

        {/* 2. EASY / HARD MODIFIERS */}
        <section className="space-y-1">
          <h3 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-1">2. Modifiers</h3>
          <p>
            <span className="text-red-400">HARD (TARGET+3):</span> unfamiliar task, extraordinary attempt, chaotic surroundings, badly injured, improvised tools, big hurry, darkness, being attacked
          </p>
          <p>
            <span className="text-green-400">EASY (TARGET-3):</span> tried and failed last turn, has training, being helped, obstacle is rickety, simple task, character larger than obstacle, has time, has relevant loot
          </p>
        </section>

        {/* 3. HEARTS */}
        <section className="space-y-1">
          <h3 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-1">3. Hearts</h3>
          <p><span className="text-pink-400">1 HEART = 10 HP.</span> Most enemies: 1 heart. Bosses: 4+ hearts.</p>
          <p className="text-hud-muted">Add a heart when: magically enhanced, &lt;3 of that monster type, near rally point, moral momentum, vastly superior tech/scale.</p>
          <p>Simpler effort: Failed attempt=no effort, Success=halfway, Crit=done instantly</p>
        </section>

        {/* 4. INITIATIVE */}
        <section className="space-y-1">
          <h3 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-1">4. Initiative</h3>
          <p>D20 unmodified. Highest goes first, then clockwise. GM goes last. Seating = marching order.</p>
        </section>

        {/* 5. MONSTER ATTACKS */}
        <section className="space-y-1">
          <h3 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-1">5. Monster Attacks</h3>
          <p>Monsters roll STR or DEX + D20 vs <span className="text-hud-accent">PLAYER DEFENSE</span> (not Target).</p>
          <p className="text-hud-muted">All other monster checks use TARGET as normal.</p>
        </section>

        {/* 6. THE THREE T's */}
        <section className="space-y-1">
          <h3 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-1">6. The Three T's (Every Room)</h3>
          <ul className="space-y-1">
            <li><span className="text-yellow-400">TIMER:</span> Roll D4, place in view. Count down each GM turn. When 0: something bad happens. Tick down early on failed rolls.</li>
            <li><span className="text-red-400">THREAT:</span> The monster/trap/damage-doer. Note: "Threat: Bugbears, Spikes"</li>
            <li><span className="text-green-400">TREAT:</span> Hidden advantage. Lever, berries, weapon stash. Scout check to find.</li>
          </ul>
        </section>

        {/* 7. CHALLENGE TUNING */}
        <section className="space-y-1">
          <h3 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-1">7. Challenge Tuning (3 Ds)</h3>
          <ul className="space-y-1 ml-1 text-hud-muted">
            <li><span className="text-hud-text">DAMAGE:</span> Increase dice type (D6→2D6). Explain with flavour.</li>
            <li><span className="text-hud-text">DISRUPTION:</span> Env hazards. Mild=nuisance, Normal=stumbler, Extreme=cataclysm.</li>
            <li><span className="text-hud-text">DURATION:</span> Use <span className="text-yellow-400">TIMER</span>. Announce or keep secret. Open = more excitement.</li>
          </ul>
        </section>

        {/* 8. REWARDS */}
        <section className="space-y-1">
          <h3 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-1">8. Rewards</h3>
          <p><span className="text-hud-accent">HERO COIN:</span> For brilliant play. Re-roll any die OR add D12 to effort. Can give to ally. 1 at a time.</p>
          <p><span className="text-hud-accent">MILESTONE:</span> Every other session or major story beats. Player picks from class list.</p>
        </section>

        {/* 9. DYNAMIC DICE */}
        <section className="space-y-1">
          <h3 className="font-hud text-[10px] text-hud-muted tracking-wider uppercase mb-1">9. Dynamic Dice (Optional)</h3>
          <p><span className="text-hud-accent">BATTLE FURY:</span> D6 near sheet, +1 per miss, added to next D20. Resets on success. Max +6.</p>
          <p><span className="text-hud-accent">BLUNDER:</span> Roll a 1? Roll again. Second 1 = opposite magic effect, hit self/ally.</p>
        </section>

        {/* 10. DCC-SPECIFIC */}
        <section className="space-y-1 bg-hud-bg p-2 border border-hud-border rounded mt-2">
          <h3 className="font-hud text-[10px] text-hud-accent tracking-wider uppercase mb-1">10. DCC-Specific GM Notes</h3>
          <ul className="space-y-1">
            <li><span className="text-hud-accent">AI FAVOUR (⚡):</span> Grant via HUD. Costs a favour point. Spent like Hero Coin.</li>
            <li><span className="text-hud-accent">SESSION GATE:</span> Hit ▶ START before players join. Use TIMER for floor collapses.</li>
            <li><span className="text-hud-accent">ROOM TARGET:</span> Set in FloorPlanner. Displayed on /display screen.</li>
            <li><span className="text-hud-accent">MOB HEARTS:</span> Pre-assign in FloorPlanner. Auto-spawn on ENTER ROOM.</li>
            <li><span className="text-hud-accent">PROTECTIONS:</span> Don't activate until after Floor 3 (canon). Permadeath on Floor 1.</li>
          </ul>
        </section>
        
      </div>
    </div>
  );
}
