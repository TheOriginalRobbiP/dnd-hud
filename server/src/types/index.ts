// ============================================================
// THE HUD — Core TypeScript Types
// Single source of truth for all data models
// ============================================================

export type EffortType = 'basic' | 'weapon' | 'magic' | 'ultimate'
export type LootBoxTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary' | 'celestial'
export type LootBoxState = 'pending' | 'authorised' | 'opened'
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'celestial'
export type StatusEffectType = 'buff' | 'debuff' | 'mixed'
export type ItemTier = 'common' | 'uncommon' | 'rare' | 'legendary'
export type UserRole = 'gm' | `player:${string}` // player:<charId>

// ── Stats ────────────────────────────────────────────────────
// 5 visible stats in DCC canon. WIS exists but is hidden from crawlers.
export interface CharacterStats {
  STR: number
  DEX: number
  CON: number
  INT: number
  CHA: number
  WIS: number // hidden — GM only, never render on player HUD
}

// ── Skill ────────────────────────────────────────────────────
export interface Skill {
  id: string
  name: string
  level: number          // 1–15 standard; 16–20 with racial unlock
  description: string
  effortType: EffortType
}

// ── Equipment ────────────────────────────────────────────────
// 13 canonical slots. Toes and Nipples are real. Do not remove.
export interface EquipmentItem {
  id: string
  name: string
  description: string
  tier: ItemTier
}

export interface EquipmentSlots {
  head: EquipmentItem | null
  face: EquipmentItem | null
  neck: EquipmentItem | null
  chest: EquipmentItem | null
  nipples: EquipmentItem | null   // canon. do not remove.
  arms: EquipmentItem | null
  hands: EquipmentItem | null
  fingers: EquipmentItem | null   // up to 10 rings
  legs: EquipmentItem | null
  feet: EquipmentItem | null
  toes: EquipmentItem | null      // canon. do not remove.
  mainHand: EquipmentItem | null
  offHand: EquipmentItem | null
}

// ── Inventory ────────────────────────────────────────────────
export interface InventoryItem {
  id: string
  name: string
  description: string
  tier: ItemTier
  isEquipped: boolean
  equippedSlot: keyof EquipmentSlots | null
  fromLootBox: boolean
  lootBoxTier: LootBoxTier | null
}

// ── Loot Box ─────────────────────────────────────────────────
// 6 tiers: bronze < silver < gold < platinum < legendary < celestial
// Unopened boxes cannot be sold, transferred, or looted from a dead body
export interface LootBox {
  id: string
  tier: LootBoxTier
  contents: InventoryItem[]
  state: LootBoxState
  assignedTo: string   // character id
  assignedAt: number   // timestamp
}

// ── Achievement ──────────────────────────────────────────────
export interface Achievement {
  id: string
  name: string
  description: string
  tier: AchievementTier
  unlockedAt: number
  isNew: boolean
}

// ── Status Effect ────────────────────────────────────────────
export interface StatusEffect {
  id: string
  name: string
  type: StatusEffectType
  description: string
  duration: number | null  // rounds; null = permanent until removed
  isCustom: boolean
}

// ── Sponsor ──────────────────────────────────────────────────
// Locked until Floor 4 — include in model, lock in UI
export interface Sponsor {
  id: string
  name: string
  description: string
  benefit: string
  isActive: boolean
}

// ── Character ────────────────────────────────────────────────
export interface Character {
  id: string
  crawlerName: string
  playerName: string
  class: string | null      // null until Floor 3 unlock
  race: string | null       // null until Floor 3 unlock
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  stats: CharacterStats
  skills: Skill[]
  equipment: EquipmentSlots
  inventory: InventoryItem[]
  achievements: Achievement[]
  viewerCount: number
  sponsors: Sponsor[]
  statusEffects: StatusEffect[]
  notes: string
  isAlive: boolean
}

// ── Mob ──────────────────────────────────────────────────────
export interface Mob {
  id: string
  name: string
  hp: number
  maxHp: number
  effortType: 'basic' | 'weapon' | 'magic'
  notes: string
}

// ── Floor State ──────────────────────────────────────────────
export interface FloorState {
  floorNumber: number
  neighbourhoodName: string
  roomNumber: number
  roomTarget: number           // public — shown to all players
  roomDescription: string      // GM only — never sync to players
  collapseTimerSeconds: number | null  // null = inactive
  collapseTimerActive: boolean
  collapseTimerStartedAt: number | null  // timestamp for client-side countdown
  activeMobs: Mob[]
}

// ── App State (full sync payload on connect) ─────────────────
export interface AppState {
  characters: Character[]
  floor: FloorState
  lootQueue: LootBox[]         // all pending/authorised boxes across all chars
  gmLog: string[]              // last 20 GM event strings
}

// ── WebSocket Messages ───────────────────────────────────────
export type WSMessage =
  | { type: 'hp_update'; charId: string; hp: number }
  | { type: 'mp_update'; charId: string; mp: number }
  | { type: 'viewer_update'; charId: string; viewerCount: number }
  | { type: 'death'; charId: string }
  | { type: 'revive'; charId: string; hp: number }
  | { type: 'room_target_update'; target: number }
  | { type: 'floor_update'; floor: Partial<FloorState> }
  | { type: 'collapse_timer_start'; seconds: number }
  | { type: 'collapse_timer_stop' }
  | { type: 'loot_assign'; lootBox: LootBox }
  | { type: 'loot_authorise'; lootBoxId: string }
  | { type: 'loot_opened'; lootBoxId: string; charId: string }
  | { type: 'announcement'; text: string; label: string }
  | { type: 'achievement_unlock'; charId: string; achievement: Achievement }
  | { type: 'status_effect_add'; charId: string; effect: StatusEffect }
  | { type: 'status_effect_remove'; charId: string; effectId: string }
  | { type: 'mob_hp_update'; mobId: string; hp: number }
  | { type: 'mob_add'; mob: Mob }
  | { type: 'mob_remove'; mobId: string }
  | { type: 'full_state_sync'; state: AppState }  // sent on client connect
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'register'; role: UserRole }           // client identifies itself on connect
  | { type: 'direct_message'; toCharId: string | 'gm'; fromCharId: string | 'gm'; fromName: string; text: string; timestamp: number }
