import { db } from './client.js'
import { characters, floorState, lootBoxes, gmLog, sessionSnapshots, floorRooms, floorPlans, campaigns } from './schema.js'
import { desc, eq, ne, and, inArray } from 'drizzle-orm'
import type { AppState, WSMessage, Character, FloorState, LootBox } from '../types/index.js'
import crypto from 'crypto'

const SANDBOX_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000'

const DEFAULT_FLOOR: FloorState = {
  sessionActive: false,
  floorNumber: 1,
  neighbourhoodName: 'The Commons',
  roomNumber: 1,
  roomTarget: 10,
  roomDescription: '',
  collapseTimerSeconds: null,
  collapseTimerActive: false,
  collapseTimerStartedAt: null,
  activeMobs: [],
  showRoomTarget: true,
  displayViewMode: 'scene',
  bonePile: [],
  preTutorialActive: false,
}

async function ensureFloorState(campaignId: string = SANDBOX_CAMPAIGN_ID) {
  const existing = await db.select().from(floorState).where(eq(floorState.campaignId, campaignId)).limit(1)
  if (existing.length === 0) {
    await db.insert(floorState).values({
      campaignId,
      ...DEFAULT_FLOOR as any
    })
    console.log('[DB] Created default floor state for campaign:', campaignId)
    const created = await db.select().from(floorState).where(eq(floorState.campaignId, campaignId)).limit(1)
    return created[0]
  }
  return existing[0]
}

export async function getFullState(campaignId: string = SANDBOX_CAMPAIGN_ID): Promise<AppState> {
  const [chars, floor, loot, log, camp] = await Promise.all([
    db.select().from(characters).where(eq(characters.campaignId, campaignId)),
    ensureFloorState(campaignId),
    db.select().from(lootBoxes).where(and(eq(lootBoxes.campaignId, campaignId), ne(lootBoxes.state, 'opened'))),
    db.select().from(gmLog).where(eq(gmLog.campaignId, campaignId)).orderBy(desc(gmLog.createdAt)).limit(20),
    db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1),
  ])

  return {
    characters: chars as unknown as Character[],
    floor: floor as unknown as FloorState,
    lootQueue: loot as unknown as LootBox[],
    gmLog: log.map((l) => l.message),
    campaign: camp[0] as any || null,
  }
}

export async function applyMessage(msg: WSMessage, campaignId: string = SANDBOX_CAMPAIGN_ID): Promise<void> {
  // Ensure floor state exists before any update
  await ensureFloorState(campaignId)

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
        .where(eq(floorState.campaignId, campaignId))
      break
    case 'floor_update':
      await db.update(floorState)
        .set({ ...(msg.floor as object), updatedAt: new Date() })
        .where(eq(floorState.campaignId, campaignId))
      break
    case 'display_room_enter':
      // Persist current room data so display can restore on reconnect
      await db.update(floorState)
        .set({
          currentRoomData: {
            roomId: msg.roomId,
            roomName: msg.roomName,
            flavourArt: msg.flavourArt,
            sceneArt: msg.sceneArt,
            battlemapArt: msg.battlemapArt,
            roomTarget: msg.roomTarget,
            theme: msg.theme,
            themeColour: msg.themeColour,
            tags: msg.tags,
          } as any,
          activeMobs: [], // Clear active mobs upon entering a new room!
          displayViewMode: 'scene', // Automatically reset to scene view mode on room enter
          updatedAt: new Date(),
        })
        .where(eq(floorState.campaignId, campaignId))
      break
    case 'display_view_mode_update':
      await db.update(floorState)
        .set({ displayViewMode: msg.mode, updatedAt: new Date() })
        .where(eq(floorState.campaignId, campaignId))
      break
    case 'bone_harvest_trigger': {
      const [f] = await db.select().from(floorState).where(eq(floorState.campaignId, campaignId)).limit(1)
      const bonePileList = (f?.bonePile as string[]) ?? []
      if (bonePileList.length === 0) break

      const activeMobsList = (f?.activeMobs as Array<{id:string; hp:number; maxHp:number; effortType:string; notes:string; posX?:number; posY?:number; name:string}>) ?? []
      
      // Find the Bone Collector or Centaminotaur as the spawn origin point
      const boneCollector = activeMobsList.find(m => 
        m.name.toUpperCase().includes('BONE COLLECTOR') || 
        m.name.toUpperCase().includes('CENTAMINOTAUR')
      )
      const bX = boneCollector?.posX ?? 50
      const bY = boneCollector?.posY ?? 50

      const spawnedSkeletons = bonePileList.map((name, k) => {
        const angle = (k * 2 * Math.PI) / bonePileList.length
        const radius = 8.0 // percentage units
        const posX = Math.round(Math.max(3, Math.min(97, bX + radius * Math.cos(angle))))
        const posY = Math.round(Math.max(3, Math.min(97, bY + radius * Math.sin(angle))))

        return {
          id: crypto.randomUUID(),
          name: `Skeletal ${name}`,
          hp: 5,
          maxHp: 5,
          effortType: 'basic' as 'basic',
          notes: 'A fragile, one-hit skeletal minion raised by the Bone Collector.',
          posX,
          posY,
        }
      })

      const updatedMobs = [...activeMobsList, ...spawnedSkeletons]
      
      await db.update(floorState)
        .set({
          activeMobs: updatedMobs,
          bonePile: [], // Clear the bone pile
          updatedAt: new Date()
        })
        .where(eq(floorState.campaignId, campaignId))

      await db.insert(gmLog).values({
        campaignId,
        message: `[Bone Harvest] The Bone Collector raised ${spawnedSkeletons.length} skeletal minions onto the tracks!`
      })
      break
    }
    case 'display_clear':
      await db.update(floorState)
        .set({ currentRoomData: null, updatedAt: new Date() })
        .where(eq(floorState.campaignId, campaignId))
      break
    case 'play_sound':
    case 'system_alert':
      // No DB state — just broadcast to all clients
      break
    case 'collapse_timer_start':
      await db.update(floorState)
        .set({ collapseTimerSeconds: msg.seconds, collapseTimerActive: true, collapseTimerStartedAt: new Date(), updatedAt: new Date() })
        .where(eq(floorState.campaignId, campaignId))
      break
    case 'collapse_timer_stop':
      await db.update(floorState)
        .set({ collapseTimerSeconds: null, collapseTimerActive: false, collapseTimerStartedAt: null, updatedAt: new Date() })
        .where(eq(floorState.campaignId, campaignId))
      break
    case 'loot_assign':
      await db.insert(lootBoxes).values({
        campaignId,
        id: msg.lootBox.id,
        tier: msg.lootBox.tier,
        contents: msg.lootBox.contents,
        state: 'pending',
        assignedTo: msg.lootBox.assignedTo,
      })
      break
    case 'loot_authorise':
      await db.update(lootBoxes).set({ state: 'authorised' }).where(eq(lootBoxes.id, msg.lootBoxId))
      break
    case 'loot_opened': {
      // 1. Retrieve the loot box details
      const [box] = await db.select().from(lootBoxes).where(eq(lootBoxes.id, msg.lootBoxId))
      if (box && box.state !== 'opened') {
        // 2. Mark the lootbox as opened
        await db.update(lootBoxes).set({ state: 'opened', openedAt: new Date() }).where(eq(lootBoxes.id, msg.lootBoxId))

        // 3. Find the assigned character
        const charId = box.assignedTo
        const [char] = await db.select().from(characters).where(eq(characters.id, charId))
        if (char) {
          // 4. Append box contents to character's inventory
          const boxContents = (box.contents as any[]) ?? []
          const currentInv = (char.inventory as any[]) ?? []
          
          // Generate unique IDs for the new items if they don't have them
          const newItems = boxContents.map(item => ({
            id: item.id || crypto.randomUUID(),
            ...item,
            fromLootBox: true,
            lootBoxTier: box.tier
          }))

          const updatedInv = [...currentInv, ...newItems]
          await db.update(characters)
            .set({ inventory: updatedInv, updatedAt: new Date() })
            .where(eq(characters.id, charId))

          // Log the event
          const itemsList = newItems.map(i => i.name).join(', ')
          await db.insert(gmLog).values({
            campaignId,
            message: `[Loot] ${char.crawlerName} opened a ${box.tier.toUpperCase()} box containing: ${itemsList}`
          })
        }
      }
      break
    }
    case 'announcement':
      await db.insert(gmLog).values({
        campaignId,
        message: `[${msg.label}] ${msg.text}`
      })
      break
    case 'mob_add': {
      const [f] = await db.select().from(floorState).where(eq(floorState.campaignId, campaignId)).limit(1)
      const mobs = [...((f?.activeMobs as object[]) ?? []), msg.mob]
      await db.update(floorState).set({ activeMobs: mobs, updatedAt: new Date() }).where(eq(floorState.campaignId, campaignId))
      break
    }
    case 'mob_remove': {
      const [f] = await db.select().from(floorState).where(eq(floorState.campaignId, campaignId)).limit(1)
      const activeMobsList = (f?.activeMobs as Array<{id:string; hp:number; name:string}>) ?? []
      const originalMob = activeMobsList.find(m => m.id === msg.mobId)
      
      const mobs = activeMobsList.filter(m => m.id !== msg.mobId)
      const updates: any = { activeMobs: mobs, updatedAt: new Date() }
      
      // If a mob was already defeated (hp <= 0) when removed, log its bones
      if (originalMob && originalMob.hp <= 0) {
        const currentBonePile = (f?.bonePile as string[]) ?? []
        updates.bonePile = [...currentBonePile, originalMob.name]
      }
      
      await db.update(floorState).set(updates).where(eq(floorState.campaignId, campaignId))
      break
    }
    case 'mob_hp_update': {
      const [f] = await db.select().from(floorState).where(eq(floorState.campaignId, campaignId)).limit(1)
      const activeMobsList = (f?.activeMobs as Array<{id:string; hp:number; name:string}>) ?? []
      const originalMob = activeMobsList.find(m => m.id === msg.mobId)
      
      const mobs = activeMobsList.map(m => m.id === msg.mobId ? {...m, hp: msg.hp} : m)
      const updates: any = { activeMobs: mobs, updatedAt: new Date() }
      
      // Add to bone pile if the mob was alive and is now killed
      if (originalMob && originalMob.hp > 0 && msg.hp <= 0) {
        const currentBonePile = (f?.bonePile as string[]) ?? []
        updates.bonePile = [...currentBonePile, originalMob.name]
      }
      
      await db.update(floorState).set(updates).where(eq(floorState.campaignId, campaignId))
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
          newInv = inv.map(i => i.id === msg.itemId ? { ...i, charges: (i.charges ?? 1) - 1 } : i)
        } else {
          newInv = inv.filter(i => i.id !== msg.itemId)
        }

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
    case 'player_notes_update': {
      await db.update(characters)
        .set({ playerNotes: msg.notes, updatedAt: new Date() })
        .where(eq(characters.id, msg.charId))
      break
    }
    case 'session_start': {
      await db.update(floorState)
        .set({ sessionActive: true, updatedAt: new Date() })
        .where(eq(floorState.campaignId, campaignId))
      await db.insert(gmLog).values({
        campaignId,
        message: '[System] Session started — crawlers can now join.'
      })
      break
    }
    case 'session_stop': {
      await db.update(characters).set({ isActive: false, updatedAt: new Date() }).where(eq(characters.campaignId, campaignId))
      await db.update(floorState)
        .set({ sessionActive: false, currentRoomData: null, updatedAt: new Date() })
        .where(eq(floorState.campaignId, campaignId))
      await db.insert(gmLog).values({
        campaignId,
        message: '[System] Session stopped — all crawlers deregistered.'
      })
      break
    }
    case 'session_reset': {
      const allChars = await db.select().from(characters).where(eq(characters.campaignId, campaignId))
      for (const char of allChars) {
        await db.update(characters)
          .set({ hp: char.maxHp, mp: char.maxMp, isAlive: true, statusEffects: [], updatedAt: new Date() })
          .where(eq(characters.id, char.id))
      }
      await db.update(floorState)
        .set({ activeMobs: [], collapseTimerActive: false, collapseTimerSeconds: null, collapseTimerStartedAt: null, roomNumber: 1, currentRoomData: null, bonePile: [], updatedAt: new Date() })
        .where(eq(floorState.campaignId, campaignId))
      await db.delete(lootBoxes).where(and(eq(lootBoxes.campaignId, campaignId), ne(lootBoxes.state, 'opened')))
      
      // Wipe the GM event log completely for this campaign
      await db.delete(gmLog).where(eq(gmLog.campaignId, campaignId))
      
      // Reset visited and current room flags for all floor plan rooms of this campaign
      const plans = await db.select().from(floorPlans).where(eq(floorPlans.campaignId, campaignId))
      const planIds = plans.map(p => p.id)
      if (planIds.length > 0) {
        await db.update(floorRooms).set({ isVisited: false, isCurrentRoom: false }).where(inArray(floorRooms.floorPlanId, planIds))
      }

      // Seed the fresh reset event into the log
      await db.insert(gmLog).values({
        campaignId,
        message: '[System] Session reset — HP/MP restored, status cleared, mobs removed, maps reset.'
      })
      break
    }
    case 'session_snapshot_save': {
      const state = await getFullState(campaignId)
      await db.insert(sessionSnapshots).values({
        campaignId,
        name: msg.name,
        snapshotData: state as any
      })
      await db.insert(gmLog).values({
        campaignId,
        message: `[System] Snapshot saved: "${msg.name}"`
      })
      break
    }
    case 'session_snapshot_load': {
      const [snap] = await db.select().from(sessionSnapshots).where(and(eq(sessionSnapshots.campaignId, campaignId), eq(sessionSnapshots.id, msg.snapshotId)))
      if (!snap) break
      const saved = snap.snapshotData as AppState
      for (const char of saved.characters) {
        await db.update(characters)
          .set({ hp: char.hp, maxHp: char.maxHp, mp: char.mp, maxMp: char.maxMp,
                 isAlive: char.isAlive, statusEffects: char.statusEffects as any,
                 inventory: char.inventory as any, achievements: char.achievements as any,
                 aiFavour: (char as any).aiFavour ?? 0, updatedAt: new Date() })
          .where(eq(characters.id, char.id))
      }
      await db.update(floorState)
        .set({ ...saved.floor as any, updatedAt: new Date() })
        .where(eq(floorState.campaignId, campaignId))
      await db.insert(gmLog).values({
        campaignId,
        message: `[System] Snapshot restored: "${snap.name}"`
      })
      break
    }
    case 'token_move': {
      if (msg.charId) {
        await db.update(characters)
          .set({ tokenPosX: msg.posX, tokenPosY: msg.posY, updatedAt: new Date() })
          .where(eq(characters.id, msg.charId))
      } else if (msg.mobId) {
        const [f] = await db.select().from(floorState).where(eq(floorState.campaignId, campaignId)).limit(1)
        const mobs = ((f?.activeMobs as Array<{id:string; posX?: number; posY?: number}>) ?? [])
          .map(m => m.id === msg.mobId ? { ...m, posX: msg.posX, posY: msg.posY } : m)
        await db.update(floorState).set({ activeMobs: mobs, updatedAt: new Date() }).where(eq(floorState.campaignId, campaignId))
      }
      break
    }
    default:
      break
  }
}
