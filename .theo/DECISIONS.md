# Decisions Log - dnd-hud

2026-05-20 | Single active floor plan schema & automatic deactivation | Setting isActive: true on any floor plan via PUT /api/floor-plans/:id automatically deactivates all other floor plans to ensure a clean, singleton active plan.
2026-05-20 | Consolidate session navigator details fetch | Replaced split HTTP requests for rooms and connections with a single fetch to /api/floor-plans/:id, matching FloorPlanner and fixing a 404 error on the non-existent connections endpoint.
2026-05-20 | Unified atomic server-side room entering | Created a POST /api/floor-plans/:id/rooms/:roomId/enter endpoint on the server to atomically set the target room as current and visited while unsetting all other current rooms, replacing inefficient and error-prone client-side multi-PUT logic.
2026-05-20 | Clean database reset for sessions | Updated session_reset to completely truncate the gmLog event table and reset visited/current attributes on all floorRooms in Postgres, ensuring resetting a session actually wipes history and returns maps to fresh states.
