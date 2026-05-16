# DND HUD — Session Planner + Display Screen Spec
_Written: 2026-05-16_

## Overview

Two new features:

1. **GM Floor Planner** — pre-session planning tool on the GM screen. Node graph of rooms, GM notes, mob/loot assignments, contingency exits.
2. **`/display` Route** — player-facing screen pushed to the spare monitor. Shows current room name, flavour art, active timer, current target. GM controls it from their screen.

---

## Phase 1 Scope (before first session)

### A. DB Schema — New Tables

#### `floorPlans`
```ts
{
  id: uuid PK
  name: text           // e.g. "Session 1 — The Frozen Tomb"
  theme: text          // e.g. "frozen-tomb" | "chaos-shrine" | "iron-foundry" | "custom"
  themeColour: text    // hex accent colour for display screen atmosphere
  isActive: boolean    // only one active floor at a time
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `floorRooms`
```ts
{
  id: uuid PK
  floorPlanId: uuid FK → floorPlans
  name: text           // "Room 1 — The Entry Hall"
  description: text    // GM-only notes (read-aloud text, secrets, NPC motivations)
  flavourArt: text     // URL or slug to display on /display screen (nullable)
  roomTarget: integer  // default target number for this room
  tags: text           // comma-separated: boss | trap | narrative | loot-room | shortcut | safe
  mobTemplateIds: text // comma-separated mob template IDs pre-assigned to this room
  lootTier: text       // default loot tier if loot spawned here: bronze|silver|gold|etc (nullable)
  posX: float          // node graph X position (for visual editor)
  posY: float          // node graph Y position (for visual editor)
  isVisited: boolean   // marked during live run
  isCurrentRoom: boolean // the room players are in right now
  createdAt: timestamp
}
```

#### `roomConnections`
```ts
{
  id: uuid PK
  floorPlanId: uuid FK → floorPlans
  fromRoomId: uuid FK → floorRooms
  toRoomId: uuid FK → floorRooms
  label: text          // e.g. "main path" | "players flee" | "secret door" | "players split"
  isContingency: boolean // false = main path, true = contingency branch
}
```

---

### B. Server — New API Routes

All under `/api/floor-plans`:

```
GET    /api/floor-plans                     — list all floor plans
POST   /api/floor-plans                     — create new floor plan
GET    /api/floor-plans/:id                 — get plan + rooms + connections
PUT    /api/floor-plans/:id                 — update plan (name, theme, isActive)
DELETE /api/floor-plans/:id                 — delete plan

GET    /api/floor-plans/:id/rooms           — list rooms for plan
POST   /api/floor-plans/:id/rooms           — create room
PUT    /api/floor-plans/:id/rooms/:roomId   — update room (including posX/posY from drag)
DELETE /api/floor-plans/:id/rooms/:roomId   — delete room

POST   /api/floor-plans/:id/connections     — create connection between rooms
DELETE /api/floor-plans/:id/connections/:connId — remove connection
```

---

### C. New WebSocket Messages

Add to BOTH `server/src/types/index.ts` AND `client/src/types/index.ts`:

```ts
// Session planner — display screen control
| { type: 'display_room_enter'; roomId: string; roomName: string; flavourArt: string | null; roomTarget: number; theme: string; themeColour: string }
| { type: 'display_clear' }  // GM clears the display screen (between rooms)
```

`display_room_enter` is broadcast to ALL clients — the `/display` route listens for it and updates.
The GM never sees this message; it's consumed by `/display` only.

---

### D. Client — New Components

#### `FloorPlanner` (GM screen, PLAN mode)
- **Route/location:** New tab on GMDashboard — "PLAN" tab alongside existing panels
- **Library:** `@xyflow/react` (React Flow v12) for the node graph
- **Node:** Each `floorRoom` = a draggable node. Colour coded by tag (boss=red, trap=amber, narrative=blue, loot=green, safe=teal).
- **Edge:** Each `roomConnection` = an arrow. Contingency edges are dashed. Label shown on hover.
- **Sidebar:** Clicking a node opens a room detail editor panel (slide-in) with:
  - Name, description (GM notes textarea), tags
  - Room target number
  - Mob template picker (from existing BestiaryPicker data)
  - Loot tier selector
  - Flavour art URL input
  - List of connections out of this room (add/remove)
- **Toolbar:** New floor plan, select active floor plan, floor name + theme selector
- **Save:** Node position auto-saved on drag end (PUT room posX/posY). Other edits save on blur/change.

#### `FloorRunnerPanel` (GM screen, RUN mode)
- **Triggered by:** Switching from PLAN → RUN at session start
- **Shows:** The same node graph, read-only. Current room highlighted (pulsing border). Visited rooms dimmed.
- **Click a node:** 
  1. Marks it as current room in DB
  2. Loads its mobs into MobTracker (spawns them via `mob_add` WS messages)
  3. Updates `floorState` room number, name, and target via `floor_update` WS message
  4. Broadcasts `display_room_enter` to push room to `/display` screen
  5. Optionally: opens room detail sidebar so GM can read their notes

#### `DisplayScreen` (new route `/display`)
- **No auth** — open URL on spare monitor, it just works
- **Listens to WS** as a viewer (registers as role `display`)
- **Layout:** Full dark screen. Shows:
  - Room name (large, themed font — same Cinzel/fantasy style as rest of HUD)
  - Flavour art (if set) — full-bleed image, slightly darkened
  - Active timer (if `collapseTimerActive`) — countdown, pulses red when <30s
  - Current target number (bottom right, subtle)
  - Floor name + theme (top left, small)
- **Atmosphere:** Background tint uses `themeColour` from the floor plan
- **Idle state:** Before any room pushed — shows floor name + theme art/logo only

---

### E. App.tsx Changes

Add `/display` route — no role selection, no PIN gate:

```tsx
// In App.tsx — detect ?display=true or path /display
if (isDisplayRoute) {
  return <DisplayScreen />
}
```

DisplayScreen connects to WS, registers as `role: 'display'`, listens for `display_room_enter` and timer updates only.

---

### F. GMDashboard.tsx Changes

Add a **PLAN / RUN** mode toggle to the header bar alongside existing controls.

- **PLAN mode:** Shows `FloorPlanner` component replacing the main panels area (or as an additional full-width panel)
- **RUN mode:** Shows `FloorRunnerPanel` as a sidebar alongside existing RoomPanel + GMLogPanel

The existing RoomPanel, GMLogPanel, CharacterBar are always visible in RUN mode — the runner panel is a third column or collapsible overlay.

---

## Floor Themes (Phase 1 — 5 to start)

| Slug | Name | Accent Colour | Vibe |
|---|---|---|---|
| `frozen-tomb` | The Frozen Tomb | `#7ecfff` (ice blue) | Ancient undead, cold silence |
| `chaos-shrine` | Chaos Shrine | `#c084fc` (chaos purple) | Warped reality, demon-touched |
| `iron-foundry` | The Iron Foundry | `#fb923c` (forge orange) | Industrial, mechanical traps |
| `merchant-underbelly` | Merchant Guild Underbelly | `#facc15` (gold) | Crime, corruption, social |
| `the-commons` | The Commons | `#94a3b8` (silver-grey) | Default — neutral starter floor |

---

## Data Flow — "Enter Room" action

```
GM clicks room node in FloorRunnerPanel
  → PUT /api/floor-plans/:id/rooms/:roomId  { isCurrentRoom: true, isVisited: true }
  → WS send: floor_update { roomNumber, neighbourhoodName, roomTarget, roomDescription }
  → WS send: display_room_enter { roomId, roomName, flavourArt, roomTarget, theme, themeColour }
  → For each mob template in room.mobTemplateIds:
      WS send: mob_add { ...spawnedMob }
  → FloorRunnerPanel highlights the entered node
  → DisplayScreen updates instantly
```

---

## Build Order (suggested for Claude Code)

1. **DB schema** — add 3 new tables, run `drizzle-kit push`
2. **Server routes** — `/api/floor-plans` CRUD
3. **Types** — add `display_room_enter` + `display_clear` to both types files
4. **WS handler** — handle `display_room_enter` (broadcast to all, don't persist)
5. **`DisplayScreen`** component + route
6. **`FloorPlanner`** component (React Flow, PLAN mode)
7. **`FloorRunnerPanel`** component (RUN mode)
8. **GMDashboard** — add PLAN/RUN toggle + wire in new panels

---

## Dependencies to Install

```bash
# Client only
npm install @xyflow/react
```

No new server dependencies needed.

---

## Phase 2 (post-first-session)

- Fog of war map reveal on `/display` (players see the map build as rooms unlock)
- Room reveal animation (fade in from black)
- Contingency navigation — click a contingency edge to jump to that room
- Floor plan templates (pre-built dungeon layouts to start from)
- Flavour art gallery — curated room images per theme, pick from a grid instead of URL input
