# Decisions Log - dnd-hud

2026-05-20 | Single active floor plan schema & automatic deactivation | Setting isActive: true on any floor plan via PUT /api/floor-plans/:id automatically deactivates all other floor plans to ensure a clean, singleton active plan.
2026-05-20 | Consolidate session navigator details fetch | Replaced split HTTP requests for rooms and connections with a single fetch to /api/floor-plans/:id, matching FloorPlanner and fixing a 404 error on the non-existent connections endpoint.
2026-05-20 | Unified atomic server-side room entering | Created a POST /api/floor-plans/:id/rooms/:roomId/enter endpoint on the server to atomically set the target room as current and visited while unsetting all other current rooms, replacing inefficient and error-prone client-side multi-PUT logic.
2026-05-20 | Clean database reset for sessions | Updated session_reset to completely truncate the gmLog event table and reset visited/current attributes on all floorRooms in Postgres, ensuring resetting a session actually wipes history and returns maps to fresh states.
2026-05-20 | Integrate and expose direct messaging for GM | Connected the dmMessages, onDMRead, and onDMEcho hooks to GMDashboard, rendering the full CharacterBar (containing the DMPanel modal trigger) in place of the static CollapsedCharStrip. GMs can toggle between collapsed and expanded layouts on both desktop and mobile.
2026-05-20 | Responsive mobile dashboard scrolling | Replaced the rigid h-screen overflow-hidden viewport constraint on mobile with a min-h-screen overflow-y-auto schema in GMDashboard.tsx. This lets the mobile layouts stretch naturally, allowing GMs to scroll down comfortably to view maps and logs beneath the expanded panels, while preserving the fixed-height layout on desktop screens.
2026-05-20 | Combined shared display screen visual overhaul | Replaced the simple static room card display with a combined layout featuring a live auto-scaling SVG Fog-of-War Map, real-time Encounter Tracker, scrolling Dungeon Log Feed ticker, and full-screen achievement popup animation.
2026-05-21 | WebSocket-scoped Party Status filtering | Filtered the Player HUD's Party Status sidebar by active connected WebSocket player IDs (activeCharIds) to hide inactive database-seeded pre-gens and show only real connected players.


