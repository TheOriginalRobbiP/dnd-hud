# Project Status - dnd-hud

## Session checkpoint 2026-05-20T16:15:00Z
- **Focus**: Fixing room sync from planning screen to session screen.
- **Done this session**:
  - Registered dnd-hud as active project in ~/.hermes/projects.yaml.
  - Setup .theo/STATUS.md and .theo/DECISIONS.md.
  - Fixed client-side room sync bug in `SessionNavigator.tsx`: Replaced broken dual-fetch with a single consolidated request to `/api/floor-plans/${active.id}` to fetch both rooms and connections.
  - Fixed server-side active floor plan update logic in `server/src/routes/floor-plans.ts` to automatically deactivate all other floor plans when setting a plan to `isActive: true`.
  - Added UI elements in `FloorPlanner.tsx` to display active state next to floor plan names in the dropdown, display an "ACTIVE" badge if the selected plan is active, and show an "ACTIVATE FLOOR" button if the selected plan is inactive.
  - Fixed TypeScript compilation error in `FloorPlanner.tsx` by declaring the `isActive` and `themeColour` properties on its local `FloorPlan` interface.
- **Open / next**:
  - Perform visual and manual verification of floor plan activation.
- **Blockers**: None.
