# The HUD — Status

## Session checkpoint 2026-05-15

**Focus:** Feature complete + QA pass ahead of first game night

**Done this session:**
- Parsed all Bopca Community Center spreadsheets → generated seed scripts
- 25 mobs + 160 items (67 bronze junk, 19 potions, 74 magic) seeded into DB on startup (idempotent)
- 24 fan skills, 28 achievements, 12 sponsors available as client data
- BestiaryPicker — new Bopca mobs appear automatically (no UI change needed)
- LootAssignModal — RANDOM mode (default), rolls from tier table on assign
- CrawlerWizard — Bopca bonus skill picker on BACKGROUNDS screen
- GMLogPanel achievement panel — BOPCA mode (28 searchable) + CUSTOM fallback
- Dice roller on player STATUS tab — digital + physical numpad modes, stat mod + skill rank, broadcasts to GM log
- AI Favour tracker (⚡) — GM grants/spends per character, shown on card + player HUD
- Session Manager (⟳ in GM header) — named snapshot save/restore + full session reset
- Schema: ai_favour col, session_snapshots table, hp_effect/mp_effect on items, unique name constraints
- Mobile QA pass: GM PIN numpad, single-card mobile navigator, safe-area-inset-bottom, responsive widths
- Obsidian note + dnd-hud skill updated to reflect current state
- 6 commits pushed to main, auto-deploys via Dokploy webhook

**Open / next session:**
- Game simulation dry-run — connect multiple devices, run a mock encounter end-to-end
- ElevenLabs voice line generation for GM announcements
- Custom portrait bank (Gravity Falls / 2D illustrated style) for the 4 pre-gens
- Verify Dokploy schema migration ran cleanly (drizzle-kit push on startup)

**Blockers:** None

---

## Session checkpoint 2026-05-16

**Focus:** Session start/stop gating + display screen room sync

**Done this session:**

- **Session start/stop button** — GM header toggle sends `session_start`/`session_stop` WS messages
- **Fixed TS2741 build error** — `sessionActive` was missing from `DEFAULT_FLOOR` constant in `state.ts`
- **Fixed client state not updating** — `session_start`/`session_stop` had no cases in `applyPatch` (client hook); added them so button text flips immediately
- **Fixed DisplayScreen not reacting** — `DisplayScreen` has its own raw WS (not `useWebSocket`), needed its own `session_start`/`session_stop` switch cases; added them
- **Room persistence on reconnect** — added `currentRoomData jsonb` column to `floor_state` schema; server now persists the full room payload on `display_room_enter` and restores it in `full_state_sync` so display recovers after page refresh
- **Fixed ENTER ROOM button missing** — button was wrapped in `{!room.isCurrentRoom && ...}` guard; once a room was marked current the button disappeared and the display could never be updated. Removed guard; current room now shows `↺ REBROADCAST TO DISPLAY` instead
- **Fixed `session_start` server-side no-op** — DB update call was missing its `.set()` chain (patch tool corruption); rewrote `state.ts` cleanly

**Current working flow:**
1. GM opens `/` → enters PIN → GM dashboard
2. Click ▶ START → button flips to ⏹ STOP; display screen exits "AWAITING SESSION START"
3. Switch to SESSION tab → floor map visible
4. Click a room node → notes panel opens on right
5. Click ENTER ROOM (or ↺ REBROADCAST TO DISPLAY if already current) → display updates with room name, flavour art, theme colour
6. Display recovers correct room automatically on reconnect (restored from `currentRoomData` in DB)

**Schema changes this session:**
- `floor_state.current_room_data` (jsonb, nullable) — added via drizzle-kit push on container restart

**Open / next session:**
- GM session planning — pre-plan floors with rooms, contingencies, narrative branches; view plan alongside live state during session (discussed at session start, not yet built)
- Crawler join flow — player selects character after GM starts session; CharacterBar shows only active crawlers (pre-gens hidden until joined)
- Game simulation dry-run — multiple devices, mock encounter end-to-end

**Blockers:** None
