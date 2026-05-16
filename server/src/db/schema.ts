import { pgTable, text, integer, boolean, jsonb, timestamp, uuid, unique, real } from 'drizzle-orm/pg-core'

// ── Characters ───────────────────────────────────────────────
export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  crawlerName: text('crawler_name').notNull(),
  playerName: text('player_name').notNull(),
  class: text('class'),
  race: text('race'),
  hp: integer('hp').notNull().default(10),
  maxHp: integer('max_hp').notNull().default(10),
  mp: integer('mp').notNull().default(0),
  maxMp: integer('max_mp').notNull().default(0),
  stats: jsonb('stats').notNull().default({}),
  skills: jsonb('skills').notNull().default([]),
  equipment: jsonb('equipment').notNull().default({}),
  inventory: jsonb('inventory').notNull().default([]),
  achievements: jsonb('achievements').notNull().default([]),
  viewerCount: integer('viewer_count').notNull().default(1000),
  sponsors: jsonb('sponsors').notNull().default([]),
  statusEffects: jsonb('status_effects').notNull().default([]),
  notes: text('notes').notNull().default(''),
  isAlive: boolean('is_alive').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  aiFavour: integer('ai_favour').notNull().default(0),  // AI Favour tokens
  portrait: text('portrait'),                           // path to portrait image e.g. /images/crawlers/doris.png
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ── Floor State ──────────────────────────────────────────────
export const floorState = pgTable('floor_state', {
  id: integer('id').primaryKey().default(1), // singleton row
  sessionActive: boolean('session_active').notNull().default(false),
  floorNumber: integer('floor_number').notNull().default(1),
  neighbourhoodName: text('neighbourhood_name').notNull().default('The Commons'),
  roomNumber: integer('room_number').notNull().default(1),
  roomTarget: integer('room_target').notNull().default(10),
  roomDescription: text('room_description').notNull().default(''),
  collapseTimerSeconds: integer('collapse_timer_seconds'),
  collapseTimerActive: boolean('collapse_timer_active').notNull().default(false),
  collapseTimerStartedAt: timestamp('collapse_timer_started_at'),
  activeMobs: jsonb('active_mobs').notNull().default([]),
  currentRoomData: jsonb('current_room_data'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ── Loot Boxes ───────────────────────────────────────────────
export const lootBoxes = pgTable('loot_boxes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tier: text('tier').notNull(), // LootBoxTier enum
  contents: jsonb('contents').notNull().default([]),
  state: text('state').notNull().default('pending'), // pending | authorised | opened
  assignedTo: text('assigned_to').notNull(), // character id
  assignedAt: timestamp('assigned_at').defaultNow(),
  openedAt: timestamp('opened_at'),
})

// ── GM Log ───────────────────────────────────────────────────
export const gmLog = pgTable('gm_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// ── Item Database ─────────────────────────────────────────────
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  tier: text('tier').notNull(),              // common | uncommon | rare | legendary
  lootBoxTier: text('loot_box_tier'),        // which box tier this typically drops from
  slot: text('slot'),                        // equipment slot, null = consumable/utility
  effortType: text('effort_type'),           // basic | weapon | magic | null
  skillBonus: text('skill_bonus'),           // e.g. "+2 to Unarmed Combat Skill"
  floorFound: integer('floor_found').default(1), // earliest floor this appears
  isConsumable: boolean('is_consumable').notNull().default(false),
  hpEffect: integer('hp_effect'),            // heal/damage on use (positive = heal)
  mpEffect: integer('mp_effect'),            // mana restore on use
  tags: text('tags').notNull().default(''), // comma-separated: weapon, armor, jewelry etc
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({ nameUnique: unique().on(t.name) }))

// ── Mob Template Database ─────────────────────────────────────
export const mobTemplates = pgTable('mob_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  hpMin: integer('hp_min').notNull().default(5),
  hpMax: integer('hp_max').notNull().default(10),
  effortType: text('effort_type').notNull().default('basic'), // basic | weapon | magic
  floor: integer('floor').notNull().default(1),
  isElite: boolean('is_elite').notNull().default(false),
  isBoss: boolean('is_boss').notNull().default(false),
  abilities: text('abilities').notNull().default(''),  // notable attacks/abilities
  notes: text('notes').notNull().default(''),          // GM tips
  tags: text('tags').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({ nameUnique: unique().on(t.name) }))

// ── Session Snapshots ─────────────────────────────────────────
// Named saves of the full game state — restore any snapshot to roll back
export const sessionSnapshots = pgTable('session_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                 // e.g. "Pre-Floor 2", "End of Session 1"
  snapshotData: jsonb('snapshot_data').notNull(), // full AppState JSON
  createdAt: timestamp('created_at').defaultNow(),
})

// ── Floor Plans ───────────────────────────────────────────────
export const floorPlans = pgTable('floor_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  theme: text('theme').notNull().default('the-commons'),
  themeColour: text('theme_colour').notNull().default('#94a3b8'),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ── Floor Rooms ───────────────────────────────────────────────
export const floorRooms = pgTable('floor_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  floorPlanId: uuid('floor_plan_id').notNull().references(() => floorPlans.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  flavourArt: text('flavour_art'),
  roomTarget: integer('room_target').notNull().default(10),
  tags: text('tags').notNull().default(''),
  mobTemplateIds: text('mob_template_ids').notNull().default(''),
  lootTier: text('loot_tier'),
  posX: real('pos_x').notNull().default(0),
  posY: real('pos_y').notNull().default(0),
  isVisited: boolean('is_visited').notNull().default(false),
  isCurrentRoom: boolean('is_current_room').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

// ── Room Connections ──────────────────────────────────────────
export const roomConnections = pgTable('room_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  floorPlanId: uuid('floor_plan_id').notNull().references(() => floorPlans.id, { onDelete: 'cascade' }),
  fromRoomId: uuid('from_room_id').notNull().references(() => floorRooms.id, { onDelete: 'cascade' }),
  toRoomId: uuid('to_room_id').notNull().references(() => floorRooms.id, { onDelete: 'cascade' }),
  label: text('label').notNull().default('main path'),
  isContingency: boolean('is_contingency').notNull().default(false),
})
