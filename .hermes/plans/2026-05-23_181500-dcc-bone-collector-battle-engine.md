# Implementation Plan: DCC Floor 1 Tutorial Arrival & Bone Collector Battle Engine

Connecting early-floor mob kills directly to the final boss battle mechanically, allowing the Bone Collector to harvest the bones of deceased goblins and rise them as skeletal minions on the VTT board.

## 1. Goal
Implement a session-scoped "Bone Pile" database tracking system on the server that monitors crawler kills across Floor 1. Set the **Arrival Chamber** as the starting room (Sector 1), requiring crawlers to crawl through a choice of tunnels (The Corridor Market or Ventilation Shafts) before reaching the **Tutorial Guild** (Sector 4) to register classes and activate inventories, leading to an 8-sector crawl ending at **The Bone Collector** exit-boss encounter at the Subway Platform (Sector 8).

---

## 2. Current Context & Assumptions
- **Tutorial Progression:** Crawlers must register their class and activate their starting gear/skills in the Tutorial Guild before they can access their VTT inventory matrix. Therefore, Sector 1 must represent their Arrival crash site, forcing them to crawl through tunnels containing weak tutorial mobs before reaching the Guild in Sector 4.
- **Floor State Singleton:** Managed via the `floor_state` table in `server/src/db/schema.ts`, which tracks active mobs and room data.
- **WebSocket State:** Synchronized in real-time across Player HUD, GM Dashboard, and the shared TV Display Screen.

---

## 3. Proposed Approach

### A. The "Bone Pile" State
Add a `bonePile` array (`jsonb`) to the `floorState` table to track the list of names/types of mobs defeated in the current session.

### B. Death Monitoring Hook
When the GM slays a mob (HP reduced to 0) or deletes a mob from the tracker, the server-side state handler catches this event, extracts the mob's profile, and appends it to `bonePile` before deleting it from `activeMobs`.

### C. The GM "Bone Harvest" Trigger
In the GM's Mob Tracker panel, if the current active room is Sector 8 (Subway Platform) and "The Bone Collector" is alive, display a prominent boss action button:
`[ TRIGGER BONE HARVEST (N Skeletons Available) ]`

Clicking this button fires a WS message: `type: "BONE_HARVEST_TRIGGER"`.

### D. Server-Side Resurrection & Broadcast
When the server receives the trigger:
1. It reads the `bonePile` array of dead mobs.
2. For each record, it creates a new active mob inside the room's `activeMobs` array with the name `"Skeletal [Original Name]"` (e.g., *"Skeletal Gryla's Babe"*), resetting its HP to a fragile `0.5 Hearts` (5 HP) and setting its coordinate position scattered radially across the derailed subway train car tracks to create physical grid obstacles.
3. Clears the `bonePile` in the DB.
4. Broadcasts the updated state to all screens.
5. Sends a global alert message (`type: "SYSTEM_ALERT"`) with an unhinged text overlay: 
   `"THE BONE COLLECTOR ROARS! THE BONES OF YOUR VICTIMS SHIVER AND RISE TO ENCIRCLE YOU!"`

---

## 4. Floor 1 Layout: Traps, Rooms & Mob Backstories

Every creature and sector is fully aligned with the dark corporate-satire of Matt Dinniman's *Dungeon Crawler Carl* universe.

### A. The Mob Group Backstories (Corporate Satires)

1. **Gryla's Babes (Goblin Infants) — Sector 2 & 6**
   * *Backstory:* Gryla is a high-ranking native dungeon boss who signed a lucrative breeding contract with Borant Corp. In exchange for a luxury safe-room penthouse on Floor 9, she supplies hundreds of her aggressive, toxic-waste-gland-infected goblin infants to serve as "nuisance mobs" on Floor 1. If crawlers kill them, Gryla legally gains "Vengeance Hunter" privileges to hunt those crawlers on later floors, boosting show ratings.
2. **Decay Moths (Equipment Shredders) — Sector 3**
   * *Backstory:* Genetically engineered by Borant's level designers to specifically consume metal and leather. They are released via air vents to degrade crawler equipment, forcing them to purchase overpriced starter gear at the high-margin "System Merchandise Exchanges" (vending machines) to maximize commercial ad revenue during "wardrobe malfunction" show segments.
3. **Queue Jumpers (Displacement Gremlins) — Sector 5**
   * *Backstory:* In their mortal lives, these creatures were notoriously impatient citizens of the galaxy who pushed in lines. As punishment, Borant geneticists spliced their DNA with quantum spatial displacement engines. Spliced so unstable they cannot occupy a single coordinate for long, they are cursed to swap coordinates with whoever stands closest.
4. **Cherombs (Sad Potato Fairies) — Sector 7**
   * *Backstory:* Originally a species of joyful, floating celestial singers. Squeezed into the shape of lumpy potatoes and filled with volatile liquid-nitrogen chemicals by Borant's weapon department. They are so deeply depressed about their current form that hurling a verbal insult at them triggers a critical emotional meltdown, causing them to explode like highly volatile grenades.
5. **The Bone Collector (The Floor Boss) — Sector 8**
   * *Backstory:* A discarded robotic recycling unit from Borant's dungeon cleanup crew. After each season, these units sweep up dead crawlers and mobs. This unit glitched, developed sentience, and began hoarding bones to construct a massive skeletal armor suit to prevent its own decommissioning. It guards the exit, believing if it gathers enough bones, it can build a ladder to escape the dungeon entirely.

---

### B. The 8-Sector Map & Traps

#### **Sector 1 — Arrival Chamber (The Crash Site)**
* **The Scene:** A collapsed sewer cavern of concrete and shale rock. Crawlers drag themselves out of the shattered elevator shaft rubble. 
* **Objective:** You must crawl through the dark service tunnels to locate the glowing green registration terminal of the Tutorial Guild.
* **First Encounter:** 2x **Hatchling Rust Swarms** (very weak clockwork insects).

#### **Sector 2 — The Corridor Market (Tunnel A)**
* **The Scene:** A tiled subway maintenance tunnel flashing with green fluorescent tubes. Yellow **System Merchandise Exchange vending machines** line the walls, flashing inflated prices. A canine Bopca guard watches from the shadows.
* **Objective:** Barter or hack the machines for starter supplies.
* **Weak Mobs:** 2x **Gryla's Babes** chewing on the wiring. Killing them triggers Gryla's permanent rage and populates the bone pile!

#### **Sector 3 — The Ventilation Shafts (Tunnel B - Shortcut Trap)**
* **The Scene:** A dusty, narrow ventilation shaft that serves as a secret bypass between Sector 1 and the Guild in Sector 4.
* **The Trap (Spore Vents & Decay Moths):** Tripping the rusty laser sensors (DC 11 DEX to spot/disable) triggers ventilation doors to open, releasing **Decay Moths**.
* **Effect:** Moths eat equipment and apply the *Pocket Full of Holes* debuff, causing the crawlers to drop inventory items until they can buy replacement armor.

#### **Sector 4 — The Tutorial Guild (Registration Hub)**
* **The Scene:** A sleek, chrome-and-steel Syndicate facility bolted directly into the cavern bedrock. In the center, a pedestal features a green glowing terminal reading **"SYSTEM CLASS SELECTION"**.
* **Objective:** Touch the screen to activate your wetware character sheets, choose starting classes (Doris, Flex, Quill, Miles), and unlock your VTT inventory slots and skills!

#### **Sector 5 — The Security Checkpoint Kiosk (Gate & Puzzle Room)**
* **The Scene:** A corporate toll-booth blockading the central junction leading deeper into the floor.
* **The Obstacle (Borant Laser Toll-Gate):** A terminal demands "10 Gold per Crawler" or a valid biometric scan.
* **Mechanics:** Pay the gold, hack the system (DC 13 INT/Thievery), or sneak past security. Failure triggers a **High-Voltage Taser Trap** (1d6 electric damage) and alerts nearby **Queue Jumpers**.

#### **Sector 6 — The Goblin Trash Nest (Relatively Easy Boss)**
* **The Scene:** A trash-filled natural cavern packed with hoarded human garbage (crushed beer cans, old suitcases, plastic waste).
* **Boss Encounter:** **Gryla's Favorite Child** (a hulking goblin berserker wearing a dirty football helmet) flanked by **Goblin Scouts**.
* **Lore Link:** Slaying him grants a Bronze Loot Box, but flags you with *Gryla's Target* (permanent campaign modifier). His bones are added to the floor database.

#### **Sector 7 — The Borant Disposal Chute (High-Risk Loot Room)**
* **The Scene:** A slide where upper-level offices dump discarded corporate paperwork, files, and defective products into the side of the Goblin Trash Nest.
* **The Encounter (The Cheromb Nursery):** A cluster of sad, volatile **Cherombs** sitting in a pile of corporate documents.
* **Effect:** Search the trash for high-value gear (Borant's garbage is your treasure), but avoid insulting the Cherombs to prevent a chain-reaction explosion!

#### **Sector 8 — The Subway Platform (The Floor Exit Boss Showdown)**
* **The Scene:** A split municipal subway station separated by a deep, bottomless chasm. The only way across is the roof of a rusted, derailed subway train car wedged between platforms.
* **The Exit Boss:** **The Bone Collector** patrols the far platform.
* **Special Mechanic (Bone Harvest):** Triggering the harvest spawns **Skeletal** versions of any mobs slain in Sector 2 or 6 directly onto the derailed subway tracks, blocking player movement. Crawlers must fight across the train car to reach the green exit: *"STAIRWELL TO FLOOR 2: THE CASTLE FLOOR"*.

---

### C. Updated Floor 1 Map Topology (8 Sectors)

```
[ Sector 1: Arrival Chamber / Crash Site ]
      │
      ├─► (maintenance corridor) ──► [ Sector 2: Corridor Market (Tunnel A) ] ──┐
      │                                                                          │
      └─► (rusty ventilation hatch) ──► [ Sector 3: Ventilation Shafts (B) ] ───┼─► [ Sector 4: Tutorial Guild ]
                                                                                │           │
                                                                                │     (toll corridor)
                                                                                │           │
                                                                                ▼           ▼
                                                                        [ Sector 5: Security Checkpoint ]
                                                                                            │
                                                                                  (security blast gate)
                                                                                            │
                                                                                            ▼
                                                                            [ Sector 6: Goblin Trash Nest ] ◄── (trash pipe) ── [ Sector 7: Disposal Chute ]
                                                                                            │                                              ▲
                                                                                            │                                      (ventilation slide)
                                                                                            │                                              │
                                                                                     (derailed tracks) ◄───────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                                            [ Sector 8: Subway Platform (Exit) ]
```

---

## 5. Files to Change
1. `server/src/db/schema.ts` — Add `bonePile` JSONB column to `floorState` table.
2. `server/src/types/index.ts` & `client/src/types/index.ts` — Sync types with `bonePile: string[]` and `BONE_HARVEST_TRIGGER` WS actions.
3. `server/src/db/state.ts` — Implement death monitoring hook & resurrection spawning.
4. `client/src/components/gm/MobTracker.tsx` — Add "Bone Harvest" action triggers.
5. `client/src/components/display/DisplayScreen.tsx` — Cinematic TV screen-shake, unhinged alert banners, and emergency red glow.
6. `server/src/db/floor-plan-seed.ts` — Re-scaffold the database seeding script to map this exact 8-sector topology and link the assets.

---

## 6. Verification & Testing
1. **Migrations Push:** Run `npm run db:push --workspace=server` to apply the `bone_pile` column.
2. **Standard Build:** Run `npm run build` to ensure both workspaces compile perfectly.
3. **Smoke Test Scenario:**
   - Slay a mob on the GM screen in Sector 2 or 6. Verify `bonePile` in server logs contains the mob name.
   - Move to Sector 8. Tap **[ TRIGGER BONE HARVEST ]** on the GM dashboard.
   - Verify that a fragile `"Skeletal"` minion spawns onto the subway tracks on the Battlemap, and that a screen-shake system alert flares up on the TV screen!
