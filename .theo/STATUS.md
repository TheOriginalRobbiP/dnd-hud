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
