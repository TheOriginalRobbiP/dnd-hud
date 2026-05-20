# Decisions Log - dnd-hud

2026-05-20 | Single active floor plan schema & automatic deactivation | Setting isActive: true on any floor plan via PUT /api/floor-plans/:id automatically deactivates all other floor plans to ensure a clean, singleton active plan.
2026-05-20 | Consolidate session navigator details fetch | Replaced split HTTP requests for rooms and connections with a single fetch to /api/floor-plans/:id, matching FloorPlanner and fixing a 404 error on the non-existent connections endpoint.
