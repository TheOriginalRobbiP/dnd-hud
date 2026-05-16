import { db } from './client.js'
import { characters, floorState, lootBoxes, gmLog, sessionSnapshots } from './schema.js'
import { desc, eq, ne } from 'drizzle-orm'
import type { AppState, WSMessage, Character, FloorState, LootBox } from '../types/index.js'

const DEFAULT_FLOOR: FloorState = {
  floorNumber: 1,
  neighbourhoodName: 'The Commons',
  roomNumber: 1,
  roomTarget: 10,
  roomDescription: '',
  collapseTimerSeconds: null,
  collapseTimerActive: false,
  collapseTimerStartedAt: null,
  activeMobs: [],
}

async function ensureFloorState() {
  const existing = await db.select().from(floorState).limit(1)
  if (existing.length === 0) {
    await db.insert(floorState).values({ id: 1, ...DEFAULT_FLOOR as any })
    console.log('[DB] Created default floor state')
    return DEFAULT_FLOOR
  }
  return existing[0]
}

export async function getFullState(): Promise<AppState> {
  const [chars, floor, loot, log] = await Promise.all([
    db.select().from(characters),
    ensureFloorState(),
    db.select().from(lootBoxes).where(ne(lootBoxes.state, 'opened')),
    db.select().from(gmLog).orderBy(desc(gmLog.createdAt)).limit(20),
  ])

  return {
    characters: chars as unknown as Character[],
    floor: floor as unknown as FloorState,
    lootQueue: loot as unknown as LootBox[],
    gmLog: log.map((l) => l.message),
  }
}

export async function applyMessage(msg: WSMessage): Promise<void> {
  // Ensure floor state exists before any update
  await ensureFloorState()

  switch (msg.type) {
    case 'hp_update':
      await db.update(characters)
        .set({ hp: msg.hp, updatedAt: new Date() })
        .where(eq(characters.id, msg.charId))
      break
    case 'mp_update':
      await db.update(characters)
        .set({ mp: msg.mp, updatedAt: new Date() })
        .where(eq(characters.id, msg.charId))
      break
    case 'viewer_update':
      await db.update(characters)
        .set({ viewerCount: msg.viewerCount, updatedAt: new Date() })
        .where(eq(characters.id, msg.charId))
      break
    case 'death':
      await db.update(characters)
        .set({ isAlive: false, updatedAt: new Date() })
        .where(eq(characters.id, msg.charId))
      break
    case 'revive':
      await db.update(characters)
        .set({ isAlive: true, hp: msg.hp, updatedAt: new Date() })
        .where(eq(characters.id, msg.charId))
      break
    case 'room_target_update':
      await db.update(floorState)
        .set({ roomTarget: msg.target, updatedAt: new Date() })
        .where(eq(floorState.id, 1))
      break
    case 'floor_update':
      await db.update(floorState)
        .set({ ...(msg.floor as object), updatedAt: new Date() })
        .where(eq(floorState.id, 1))
      break
    case 'collapse_timer_start':
      await db.update(floorState)
        .set({ collapseTimerSeconds: msg.seconds, collapseTimerActive: true, collapseTimerStartedAt: new Date(), updatedAt: new Date() })
        .where(eq(floorState.id, 1))
      break
    case 'collapse_timer_stop':
      await db.update(floorState)
        .set({ collapseTimerSeconds: null, collapseTimerActive: false, collapseTimerStartedAt: null, updatedAt: new Date() })
        .where(eq(floorState.id, 1))
      break
    case 'loot_assign':
      await db.insert(lootBoxes).values({
        id: msg.lootBox.id, tier: msg.lootBox.tier,
        contents: msg.lootBox.contents, state: 'pending',
        assignedTo: msg.lootBox.assignedTo,
      })
      break
    case 'loot_authorise':
      await db.update(lootBoxes).set({ state: 'authorised' }).where(eq(lootBoxes.id, msg.lootBoxId))
      break
    case 'loot_opened':
      await db.update(lootBoxes).set({ state: 'opened', openedAt: new Date() }).where(eq(lootBoxes.id, msg.lootBoxId))
      break
    case 'announcement':
      await db.insert(gmLog).values({ message: `[${msg.label}] ${msg.text}` })
      break
    case 'mob_add': {
      const [f] = await db.select().from(floorState).limit(1)
      const mobs = [...((f?.activeMobs as object[]) ?? []), msg.mob]
      await db.update(floorState).set({ activeMobs: mobs, updatedAt: new Date() }).where(eq(floorState.id, 1))
      break
    }
    case 'mob_remove': {
      const [f] = await db.select().from(floorState).limit(1)
      const mobs = ((f?.activeMobs as Array<{id:string}>) ?? []).filter(m => m.id !== msg.mobId)
      await db.update(floorState).set({ activeMobs: mobs, updatedAt: new Date() }).where(eq(floorState.id, 1))
      break
    }
    case 'mob_hp_update': {
      const [f] = await db.select().from(floorState).limit(1)
      const mobs = ((f?.activeMobs as Array<{id:string;hp:number}>) ?? []).map(m => m.id === msg.mobId ? {...m, hp: msg.hp} : m)
      await db.update(floorState).set({ activeMobs: mobs, updatedAt: new Date() }).where(eq(floorState.id, 1))
      break
    }
    case 'achievement_unlock': {
      const [char] = await db.select().from(characters).where(eq(characters.id, msg.charId))
      if (char) {
        const achievements = [...((char.achievements as object[]) ?? []), msg.achievement]
        await db.update(characters).set({ achievements, updatedAt: new Date() }).where(eq(characters.id, msg.charId))
      }
      break
    }
    case 'status_effect_add': {
      const [char] = await db.select().from(characters).where(eq(characters.id, msg.charId))
      if (char) {
        const effects = [...((char.statusEffects as object[]) ?? []), msg.effect]
        await db.update(characters).set({ statusEffects: effects, updatedAt: new Date() }).where(eq(characters.id, msg.charId))
      }
      break
    }
    case 'status_effect_remove': {
      const [char] = await db.select().from(characters).where(eq(characters.id, msg.charId))
      if (char) {
        const effects = ((char.statusEffects as Array<{id:string}>) ?? []).filter(e => e.id !== msg.effectId)
        await db.update(characters).set({ statusEffects: effects, updatedAt: new Date() }).where(eq(characters.id, msg.charId))
      }
      break
    }
    case 'use_item': {
      const [char] = await db.select().from(characters).where(eq(characters.id, msg.charId))
      if (char) {
        const inv = (char.inventory as Array<{id:string; charges?: number | null}>) ?? []
        const item = inv.find(i => i.id === msg.itemId)
        let newInv: typeof inv

        if (item && item.charges != null && item.charges > 1) {
          // Decrement charges — item stays
          newInv = inv.map(i => i.id === msg.itemId ? { ...i, charges: (i.charges ?? 1) - 1 } : i)
        } else {
          // Single use or last charge — remove item
          newInv = inv.filter(i => i.id !== msg.itemId)
        }

        // Apply HP/MP effects
        const updates: Record<string, unknown> = { inventory: newInv, updatedAt: new Date() }
        if (msg.hpEffect) {
          const newHp = Math.max(0, Math.min(char.maxHp, char.hp + msg.hpEffect))
          updates.hp = newHp
        }
        if (msg.mpEffect) {
          const newMp = Math.max(0, Math.min(char.maxMp, char.mp + msg.mpEffect))
          updates.mp = newMp
        }

        await db.update(characters).set(updates).where(eq(characters.id, msg.charId))
      }
      break
    }
    case 'ai_favour_update': {
      const [char] = await db.select().from(characters).where(eq(characters.id, msg.charId))
      if (char) {
        const newFavour = Math.max(0, ((char as any).aiFavour ?? 0) + msg.delta)
        await db.update(characters)
          .set({ aiFavour: newFavour, updatedAt: new Date() } as any)
          .where(eq(characters.id, msg.charId))
      }
      break
    }
    case 'session_start': {
      await db.update(floorState)
        .set({ sessionActive: true, updatedAt: new Date() })
        .where(eq(floorState.id, 1))
      await db.insert(gmLog).values({ message: '[System] Session started — crawlers can now join.' })
      break
    }
    case 'session_stop': {
      // Deactivate all characters (clear joined slots)
      await db.update(characters).set({ isActive: false, updatedAt: new Date() })
      await db.update(floorState)
        .set({ sessionActive: false, updatedAt: new Date() })
        .where(eq(floorState.id, 1))
      await db.insert(gmLog).values({ message: '[System] Session stopped — all crawlers deregistered.' })
      break
    }
    case 'session_reset': {
      // Reset all characters: HP to max, clear status effects, revive dead
      const allChars = await db.select().from(characters)
      for (const char of allChars) {
        await db.update(characters)
          .set({ hp: char.maxHp, mp: char.maxMp, isAlive: true, statusEffects: [], updatedAt: new Date() })
          .where(eq(characters.id, char.id))
      }
      // Reset floor: clear mobs, stop collapse timer, reset room to 1
      await db.update(floorState)
        .set({ activeMobs: [], collapseTimerActive: false, collapseTimerSeconds: null, collapseTimerStartedAt: null, roomNumber: 1, updatedAt: new Date() })
        .where(eq(floorState.id, 1))
      // Clear pending/authorised loot boxes
      await db.delete(lootBoxes).where(ne(lootBoxes.state, 'opened'))
      // Log it
      await db.insert(gmLog).values({ message: '[System] Session reset — HP/MP restored, status cleared, mobs removed.' })
      break
    }
    case 'session_snapshot_save': {
      const state = await getFullState()
      await db.insert(sessionSnapshots).values({ name: msg.name, snapshotData: state as any })
      await db.insert(gmLog).values({ message: `[System] Snapshot saved: "${msg.name}"` })
      break
    }
    case 'session_snapshot_load': {
      const [snap] = await db.select().from(sessionSnapshots).where(eq(sessionSnapshots.id, msg.snapshotId))
      if (!snap) break
      const saved = snap.snapshotData as AppState
      // Restore all characters
      for (const char of saved.characters) {
        await db.update(characters)
          .set({ hp: char.hp, maxHp: char.maxHp, mp: char.mp, maxMp: char.maxMp,
                 isAlive: char.isAlive, statusEffects: char.statusEffects as any,
                 inventory: char.inventory as any, achievements: char.achievements as any,
                 aiFavour: (char as any).aiFavour ?? 0, updatedAt: new Date() })
          .where(eq(characters.id, char.id))
      }
      // Restore floor state
      await db.update(floorState)
        .set({ ...saved.floor as any, updatedAt: new Date() })
        .where(eq(floorState.id, 1))
      await db.insert(gmLog).values({ message: `[System] Snapshot restored: "${snap.name}"` })
      break
    }
    default:
      break
  }
}
