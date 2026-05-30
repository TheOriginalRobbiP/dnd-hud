# Implementation Plan: DCC-Themed Loot Boxes & Specialty Box Types

This plan outlines the design and integration of canonical **Dungeon Crawler Carl (DCC)** loot box tiers, specialty types, and custom unboxing mechanics into the `dnd-hud` application, directly utilizing intelligence extracted from `Atlas-Tutorial Floors.pdf`.

---

## 1. Goal

Upgrade the current simple loot box mechanism in the HUD to support the **6 standard tiers** (Bronze to Celestial) combined with **12 specialty box types** (like Goblin, Assassin, Lucky Bitch, and Asshole boxes), adding thematic items, custom filtering, and an immersive, unhinged DCC unboxing experience.

---

## 2. Current Context & Database Schema

In the existing codebase:
* **Tiers** are defined as: `'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary' | 'celestial'`.
* **State** of a box is tracked via: `'pending' | 'authorised' | 'opened'`.
* **Database Representation** (`pgTable('loot_boxes')`):
  ```typescript
  export const lootBoxes = pgTable('loot_boxes', {
    id: uuid('id').primaryKey().defaultRandom(),
    tier: text('tier').notNull(),
    contents: jsonb('contents').notNull().default([]),
    state: text('state').notNull().default('pending'),
    assignedTo: text('assigned_to').notNull(),
    assignedAt: timestamp('assigned_at').defaultNow(),
    openedAt: timestamp('opened_at'),
  })
  ```
* **Loot Assign Interface** (`LootAssignModal.tsx`): Allows the GM to select a tier and assign items randomly, from search results, or with custom overrides. Strict filter restricts items to their assigned `lootBoxTier` drop limits.

---

## 3. Proposed Approach: DCC Specialty Box Types

We will introduce **12 Specialty Box Types** as defined in the official Tutorial Floors Guide:

| Box Type | Description / Prompt Vibe | Item Tag Matching / Association |
|---|---|---|
| **Adventurer** | Catch-all low-level gear | `armor`, `potion`, `basic`, `utility` |
| **Assassin** | Stealth, poison, and finessed murder | `dagger`, `poison`, `stealth`, `speed` |
| **Lucky Bitch** | Relying on luck/AI while being punished | `luck`, `scroll`, `gamble`, `healing` |
| **Asshole** | Terribles choices yield terrible prizes | `curse`, `junk`, `unreliable`, `hazard` |
| **Goblin** | Love for explosive demolition | `explosive`, `fire`, `demolition`, `tools` |
| **Looter** | Kleptomaniac / inventory actions | `bag`, `scroll`, `chest`, `jewelry` |
| **Lucky Bastard** | Seemingly impossible achievements | `chips`, `ticket`, `token`, `luck` |
| **Mechanic** | Vehicle, mounts, and crafting gears | `crafting`, `tool`, `engine`, `vehicle` |
| **Pet** | Actions related to companions/summoning | `biscuit`, `summon`, `pet`, `feed` |
| **Quest** | Standard, rigid quest completion | `quest-reward`, `relic`, `key` |
| **Savage** | Bloodthirsty pvp, finding and killing | `blade`, `net`, `trap`, `blood` |
| **Survivor** | Extreme, close-shave escape rewards | `heal`, `shield`, `barrier`, `medic` |

---

## 4. Step-by-Step Plan

### Phase 1: DB Schema & Types Expansion
1. **Types Update** (`client/src/types/index.ts` & `server/src/types/index.ts`):
   * Declare the new `LootBoxType` union:
     ```typescript
     export type LootBoxType =
       | 'adventurer' | 'assassin' | 'lucky_bitch' | 'asshole' | 'goblin'
       | 'looter' | 'lucky_bastard' | 'mechanic' | 'pet' | 'quest'
       | 'savage' | 'survivor';
     ```
   * Update the `LootBox` interface to include `boxType: LootBoxType`.
2. **Schema Migration** (`server/src/db/schema.ts`):
   * Add a `boxType` column to the `lootBoxes` table definition:
     ```typescript
     boxType: text('box_type').notNull().default('adventurer')
     ```
   * Run the Drizzle DB migration using `npx drizzle-kit generate` and `npx drizzle-kit migrate` against the container database.

### Phase 2: GM Assignment Interface Upgrade (`LootAssignModal.tsx`)
1. **Thematic Selector**:
   * Add a dropdown or grid selector to let the GM pick the **Specialty Box Type** (defaulting to `Adventurer` or based on recent achievements).
2. **Smart Item Tag Filtering**:
   * Modify the database query helper so that when a specific Box Type is chosen, it filters the available items list to matching tags (e.g., selecting a `Goblin Box` automatically prioritizes items containing the tag `explosive` or `fire`).
3. **Thematic Prompt Suggestions**:
   * Show a dynamic System AI box-opening dialogue suggestion on the GM side, helping the GM roleplay the AI's unhinged or sarcastic reaction to the unboxing.

### Phase 3: Player HUD Unboxing Experience (`StatusTab.tsx` / `LootModal`)
1. **Thematic Box Skins & Glows**:
   * Design a gorgeous, responsive floating modal showing the box model/card.
   * Customize the container styles, background gradients, and glowing accents to match the Box Type:
     * **Goblin Box**: Rusty green frame, radioactive smoke shadows, hazard borders.
     * **Assassin Box**: Matte-black border, deep crimson shadows, sleek target crosshairs.
     * **Lucky Bitch Box**: Bright pink, glittery bubbles, slightly sarcastic smiley faces.
     * **Asshole Box**: Sordid brown/mustard grid, static/fuzz distortion filters.
     * **Survivor Box**: High-alert medical white/red crosshairs, green glowing neon.
2. **Animated Unboxing Loop**:
   * When the player clicks **OPEN BOX**, play a retro sci-fi slot-machine text flicker for the item names before revealing the drops.
3. **System AI Commentary Feed**:
   * Display a custom, lore-accurate System AI direct dialogue block inside the opening window based on the chosen box type:
     * *Asshole Box:* `"You sleep soundly after those terrible decisions, crawler? Here is the garbage you deserve."`
     * *Lucky Bitch Box:* `"Relying on game glitches like a little bitch? Enjoy your little bitch box."`
     * *Savage Box:* `"Oh look, we have a little murder-hobo on our hands! Slay away."`

---

## 5. Files to Change

* **Shared/Types**:
  * `client/src/types/index.ts` — Type definitions for LootBox, items.
  * `server/src/types/index.ts` — Aligning server-side types.
* **Server Backend**:
  * `server/src/db/schema.ts` — Add `box_type` column to Drizzle.
  * `server/src/db/state.ts` — Set `boxType` on `loot_assign` insert statements.
* **GM Frontend**:
  * `client/src/components/gm/LootAssignModal.tsx` — Specialty selector, dynamic item tag filtering, and random seed generators.
* **Player Frontend**:
  * `client/src/components/player/StatusTab.tsx` or `LootModal` equivalent — Complete overhaul of the unboxing visual states, glowing containers, and sarcastic System AI announcements.

---

## 6. Risks, Tradeoffs, and Verification

* **Risk (DB Schema)**: Pushing a schema column update directly might require a rebuild of the database container if local migrations are out of sync.
  * *Mitigation:* We can also choose to pass and store the `boxType` field directly inside the existing `contents` or `metadata` JSONB arrays, making it 100% backward compatible without any table alterations!
* **Tradeoff**: Restricting random drops too heavily by tags can leave certain box types (like Assassin) empty if there are few stealth items in the database.
  * *Mitigation:* Implement a fallback catch-all so that if no themed items exist, standard items of equivalent tier (Bronze/Silver/etc.) are substituted.
* **Verification Steps**:
  1. Trigger a mock `Savage Box` allocation from the GM dashboard.
  2. Verify it displays with the correct PVP thematic cards on the player HUD.
  3. Authorize and Open, checking that the items are successfully transferred to the crawler's inventory without dropping connection.
