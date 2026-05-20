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
  - Implemented POST `/api/floor-plans/:id/rooms/:roomId/enter` endpoint on the server to atomically handle room entries (making target current/visited, deactivating others) and migrated all frontend components (`SessionNavigator`, `FloorRunnerPanel`) to use this unified, atomic, database-backed endpoint. This resolves the bug where entered rooms were not persisted on the server, causing polling cycles to continuously revert the selection back to "The Arrival".
  - Extended the server-side `session_reset` WebSocket transaction to completely clear out the GM Event Log table (`gmLog`) and reset the `isVisited = false` and `isCurrentRoom = false` states of all floor plan rooms in Postgres, restoring full session reset functionality across the entire dashboard and connected player HUDs.
  - Added a symmetrical gear settings button (`⚙️`) in the top-right header of `GMDashboard.tsx` (next to the ACTIVE/STOPPED button, matching the design of the logout button on the far-left). This finally provides the GM with an easily accessible, cross-platform (desktop + mobile) trigger to open the `SessionManager` modal (Reset Session, Save Snapshots, and Restore Snapshots).
  - Fixed GM-to-Player messaging (Direct Messages / DMPanel) by passing websocket DM props (`dmMessages`, `onDMRead`, `onDMEcho`) down to `GMDashboard`, importing the unused `CharacterBar` component, and rendering it conditionally in place of the static `CollapsedCharStrip` with smooth, toggleable expand/collapse triggers. This restores full player DM capability on both desktop and mobile layouts!
  - Cleaned up direct messaging thread scoping and routing inside `DMPanel.tsx` so that GMs and players only see message threads matching their selected recipient (rather than scrambling all chats from all players into a single scrolling thread).
  - Filtered the GM's recipient button selector in `DMPanel.tsx` by the live list of connected crawlers (`activeCharIds` passed down from the top-level websocket), ensuring GMs only see and can select currently connected players for direct private messaging.
  - Resolved dynamic placeholder messaging bug in the DM panel to show the actual recipient crawler's name instead of a hardcoded ellipsis (`...`).
  - Patched client-side TypeScript typing gaps in `useWebSocket.ts` (added `toCharId` to the `DirectMessage` interface) and fixed rendering compilation parameters inside `GMDashboard.tsx` to properly propagate `activeCharIds` down to `<CharacterBar>` and `<DMPanel>`, ensuring a 100% clean TypeScript build on Dokploy!
- **Open / next**:
  - Perform visual and manual verification of floor plan activation.
- **Blockers**: None.
