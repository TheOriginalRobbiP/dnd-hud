# Project Status - dnd-hud

## Session checkpoint 2026-05-22T10:00:00Z
- **Focus**: Starting gear balance and Crawler status card sizing.
- **Done this session**:
  - Discussed starting gear design philosophies for the DCC/ICRPG homebrew (DCC Raw trade tool/occupation weapons vs ICRPG starting/basic loot).
  - **Rule-set decision & implementation**: Aligned on and built the **Panic Area Scrounge (Option A & B Hybrid)** rule-set based on collaborative feedback. The lore explanation is that crawlers have exactly 1 hour of prep time from the initial Syndicate AI announcement to scrounge through the flat concrete rubble and smoking ruins of their flattened neighborhood before being forced into the dungeon.
  - **Starting Kits Refactor**: Re-engineered all 26 starting combat options inside `characterCreation.ts` to represent scrounged, improvised everyday items found in the ruins of the area. Removed functional firearms (handguns and shotguns) entirely from starting gear to keep survival challenging (making them rare loot box drops instead), replacing them with heavy construction tools like the `Pneumatic Staple Gun (Handgun)` and `Framing Nail Gun (Shotgun)`. Updated Step 4 of the Character Creation Wizard (`CrawlerWizard.tsx`) to feature this high-immersion backstory.
  - **Sizing fix**: Comprehensively refactored crawler status cards (`StatusTab.tsx`, `CharacterCard.tsx`, `InspectModal.tsx`) across both player and GM interfaces to use `object-contain bg-black/20` and slimmer/smaller dimensions. This completely prevents portrait images from being cut off, fully displaying the characters while making the cards visually tighter and smaller on screen.
  - **Hearts HUD Swap**: Swapped out the linear horizontal green health bars in `HPBar.tsx` for a dynamic row of custom SVG Heart containers. It automatically groups crawler HP into standard ICRPG Heart units (1 Heart = 10 HP). Dynamically fills containers left-to-right using horizontal SVG clipping masks and applies flashing/pulsing drop-shadow indicators under critical (<=25%) health conditions.
  - Successfully verified clean type-compilation and production build with `tsc && vite build` (exit code: 0).
- **Open / next**:
  - Refine player dashboard layout, fonts, and colors to match DCC/Bopca specifications.
- **Blockers**: None.

## Session checkpoint 2026-05-21T07:30:00Z
- **Focus**: Refining the player dashboard party status.
- **Done this session**:
  - Filtered the Player HUD's Party Status sidebar (`PartySidebar`) to show only other crawlers who are currently online and active in the WebSocket session (`activeCharIds`).
  - Passed `activeCharIds` from `App.tsx` down through `PlayerHUD` and `StatusTab` to `PartySidebar`.
  - Added parent-side conditional rendering inside `PlayerHUD` and `StatusTab` to completely hide the Party Status container and border/padding elements on both mobile and desktop if there are no other connected party members online, avoiding empty layout boxes.
  - Successfully ran a full TypeScript compiler check (`npm run build`), confirming 100% clean build.
- **Open / next**:
  - Refine player dashboard layout, fonts, and colors to match DCC/Bopca specifications.
- **Blockers**: None.

## Session checkpoint 2026-05-20T18:45:00Z
- **Focus**: Overhauling the shared display screen (`/display` route) with a dynamic combined dashboard.
- **Done this session**:
  - Overhauled the `/display` shared wall TV screen. Upgraded from a simple static room title card to an immersive, full-scale combined dashboard featuring:
    - **Header Bar**: Live floor/location panel alongside a synchronized countdown collapse timer with critical red flashing animations.
    - **Tactical Node Map (Left)**: Integrated a custom React coordinate auto-scaling engine that takes database node coordinates (`posX`/`posY`) and dynamically auto-fits them onto an `1100` x `440` SVG canvas. Added real Fog-of-War aesthetics (explored nodes are green, active is pulsing gold, unexplored nodes are hidden with "?" labels and dashed borders).
    - **Room Info Card (Bottom-Left)**: Displays the active room's description, tags (e.g. `BOSS`, `SAFE`), and a massive, glowing universal Room Target DC.
    - **Encounter Tracker (Right)**: Synchronized with the websocket's active mob list, rendering vertical creature cards with HP health bars, elite/boss indicators, and description notes.
    - **Dungeon Log Ticker (Footer)**: A smooth, marquee stock ticker at the bottom scrolling the latest 20 GM log events (healing, damage, transitions, achievements), color-coded by event type.
    - **Achievement Overlay**: A full-screen, high-contrast, blur-backdrop popup that springs up when a player triggers an `'achievement_unlock'` event, styled by tier (celestial, gold, silver, bronze), auto-hiding after 7 seconds.
  - Resolved client-side TypeScript compilation warnings, including handling the stale `characters` closure in the WebSocket hook via a synced `charactersRef` and fixing the `'platinum'` string type mismatch with the database's strict `AchievementTier` definition. Confirmed a 100% clean `tsc` check.
- **Open / next**:
  - Push the visual update to GitHub (`origin/main`) to trigger Dokploy's auto-deploy webhook on the Helsinki VPS.
  - Smoke test the live display screen at `https://dnd.rjp.digital/display` with a connected GM Dashboard.
- **Blockers**: None.

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
  - Fully cleaned up unused states (`showInactive`, `setShowInactive`) and variables (`inactiveCharacters`) inside `CharacterBar.tsx` following the removal of the Inactive Crawlers accordion, satisfying strict compile rules on subsequent builds.
  - Redesigned the viewport responsiveness inside `GMDashboard.tsx` to handle small screens (mobile/tablets). Replaced the rigid, clipping `h-screen overflow-hidden` wrapper layout on mobile with a dynamic `min-h-screen overflow-y-auto` schema, relaxed child height and scrolling constraints on the single-tab viewports, and pushed mobile navigation paddings, allowing the entire page layout to scroll smoothly and naturally underneath the fixed bottom navigation bar!
- **Open / next**:
  - Perform visual and manual verification of floor plan activation.
- **Blockers**: None.
