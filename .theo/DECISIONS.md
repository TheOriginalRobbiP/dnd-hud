# DnD HUD Decisions

2026-05-29 | Add Back Button to GM Login Gate | Added an onBack callback to GMPinGate to allow users to return to role/crawler selection screen if they select GM by mistake.
2026-05-29 | Interactive Rules Presentation on TV Display | Integrated a multi-slide tutorial into DisplayScreen.tsx powered by a GM dashboard controller, avoiding DB schema changes by overloading the text-based displayViewMode column with tutorial state strings (e.g. tutorial_0, tutorial_1).
2026-05-29 | Dynamic Details Toggle on Rules Presentation | Extended rules slideshow to support on-demand detailed mechanics overlays on the TV, controlled live by a GM toggle checkbox.
2026-05-29 | Persistent JSONB Lootbox Specialty Storage | Saved boxType inside the contents jsonb column in PostgreSQL, avoiding table schema migrations and maintaining perfect backward-compatibility.
2026-05-29 | Robust Room Tag Safe Evaluation | Upgraded current room tags parsing in LootBox.tsx to support both raw strings and string arrays safely, resolving TypeError crashes in isSafeRoom checks.
2026-05-29 | Client-side Decryption & Claim Reward Flow | Separated the unboxing process into local decryption and server-side claiming, preventing boxes from instantly vanishing upon trigger and letting players enjoy custom AI commentaries.
2026-05-29 | Local Mechanical Sound & Remote Voice Broadcast | Routed mechanical loot_box opening sound locally to the player HUD and kept voice-line announcements as broadcasted room sounds to prevent dual-overlapping audio collisions.
2026-05-30 | Wipe Static Database Catalogs on Server Startup | Added automatic deletion of items and mobTemplates tables to seed.ts right before inserting. This permanently eliminates ghost/duplicate and truncated database items left over from previous iterations, while remaining 100% safe as player inventories are stored as self-contained inline JSON snapshots in the characters table.
2026-05-30 | Click-to-Load Dynamic Action Roller | Unified the character action interface by passing a parent selectedAction state down to DiceHero, SkillsTab, and InventoryTab. This allows players to click any skill, equipped item, backpack item, or primary attribute (STR, DEX, CON, INT, CHA) to automatically load it with its custom modifiers, stat names, and effort dice into the roller, replacing hardcoded weapon-only elements.
2026-05-30 | Correct Campaign Stat Modifier Formula | Fixed a discrepancy where DiceHero and DiceRoller were using the outdated formula Math.floor((score - 4) / 2) for stat modifiers. Updated them to use score - 4, aligning the dice calculations 100% with the player HUD attribute panel and character creation module.


