import { db } from './client.js'
import { floorPlans, floorRooms, roomConnections } from './schema.js'
import { eq } from 'drizzle-orm'

export async function seedFloorPlans() {
  console.log('[seed] Wiping old floor plans and connections (cascade)...')
  await db.delete(floorPlans)

  console.log('[seed] Pre-seeding Floor 1: "The Commons" layout with Scene & Battlemap pairs...')

  // 1. Insert Floor Plan
  const [plan] = await db.insert(floorPlans).values({
    name: 'Floor 1 — The Commons',
    theme: 'the-commons',
    themeColour: '#f59e0b',
    isActive: true, // Make this plan active by default!
  }).returning()

  // 2. Insert Rooms with Czepeku-style Scene Art & Battlemap Art
  const roomsData = [
    {
      name: 'Sector 1 — Dungeon Entrance',
      description: 'The sky cracked. The elevator dropped. You are standing in a high-vaulted cavern of cold stone, with sunbeams piercing through steep shale crevices above. The System stable indicators glow faintly.\n\n### FEATURES\nLoose rubble, narrow ledges. DC 10.\n\n### ENTRANCE DEBRIS\nYou have 1 hour of scrounge time to gather gear before the level begins its collapse.',
      sceneArt: '/images/rooms/sector1_entrance_scene.png',
      battlemapArt: '/images/rooms/sector1_entrance_battlemap.png',
      roomTarget: 10,
      tags: 'start,safe',
      posX: 100,
      posY: 220,
    },
    {
      name: 'Sector 2 — The Boiling Altar',
      description: 'The stench of sulfur is overwhelming. Stone bridges cross streams of orange, boiling magma. In the center sits an ancient, heavy black altar pulsing with heat check DC 12.\n\n### THERMAL DREAD\nMagma pools are FAR. Moving into them results in 2d6 thermal damage per round.',
      sceneArt: '/images/rooms/sector2_altar_scene.png',
      battlemapArt: '/images/rooms/sector2_altar_battlemap.png',
      roomTarget: 12,
      tags: 'hazard,puzzle',
      posX: 350,
      posY: 100,
    },
    {
      name: 'Sector 3 — The Rotting Vestibule',
      description: 'Thick blue mist hangs low, smelling of decay and wet copper. Stone columns support decaying archways. Shadows shift in the corners—you are not alone.\n\n### COLD AMBUSH\nHostile crawlers are nearby. DC 11 to notice ambush markers.',
      sceneArt: '/images/rooms/sector3_vestibule_scene.png',
      battlemapArt: '/images/rooms/sector3_vestibule_battlemap.png',
      roomTarget: 11,
      tags: 'mob-room',
      posX: 350,
      posY: 340,
      mobTemplateIds: 'Goblin Scout,Goblin Shaman',
    },
    {
      name: 'Sector 4 — The Loot Vault',
      description: 'A glowing chamber containing ancient brass chest slots, locked in safe frames. Golden coins litter the floor. The System approves of your greed.\n\n### LOOT TIER: SILVER\nSilver chest is locked. DC 10 with Thieves Tools to crack.',
      sceneArt: '/images/rooms/sector4_loot_scene.png',
      battlemapArt: '/images/rooms/sector4_loot_battlemap.png',
      roomTarget: 10,
      tags: 'safe,loot-room',
      posX: 600,
      posY: 340,
      lootTier: 'silver',
    },
    {
      name: 'Sector 5 — The Obsidian Chasm',
      description: 'A terrifying, bottomless chasm bridged by a single, slick obsidian span. Lava flares cast long, rhythmic red shadows. On the far side, the guardian of Floor 1 awaits.\n\n### BOSS ENCOUNTER\nThe Centaminotaur is pacing. DC 14 to maintain posture in his presence.',
      sceneArt: '/images/rooms/sector5_chasm_scene.png',
      battlemapArt: '/images/rooms/sector5_chasm_battlemap.png',
      roomTarget: 14,
      tags: 'boss,trap',
      posX: 850,
      posY: 220,
      mobTemplateIds: 'Centaminotaur',
    },
  ]

  const createdRooms: any[] = []
  for (const r of roomsData) {
    const [room] = await db.insert(floorRooms).values({
      floorPlanId: plan.id,
      name: r.name,
      description: r.description,
      flavourArt: r.battlemapArt, // fallback
      sceneArt: r.sceneArt,
      battlemapArt: r.battlemapArt,
      roomTarget: r.roomTarget,
      tags: r.tags,
      mobTemplateIds: r.mobTemplateIds ?? '',
      lootTier: r.lootTier ?? null,
      posX: r.posX,
      posY: r.posY,
      isVisited: r.name.includes('Entrance'),
      isCurrentRoom: r.name.includes('Entrance'), // Default start in room 1!
    }).returning()
    createdRooms.push(room)
  }

  // 3. Connect Rooms
  const room = (name: string) => createdRooms.find(r => r.name.includes(name))!

  await db.insert(roomConnections).values([
    {
      floorPlanId: plan.id,
      fromRoomId: room('Entrance').id,
      toRoomId: room('Boiling Altar').id,
      label: 'magma trail',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Entrance').id,
      toRoomId: room('Rotting Vestibule').id,
      label: 'mist path',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Rotting Vestibule').id,
      toRoomId: room('Loot Vault').id,
      label: 'iron vault door',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Boiling Altar').id,
      toRoomId: room('Obsidian Chasm').id,
      label: 'high bridge',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Rotting Vestibule').id,
      toRoomId: room('Obsidian Chasm').id,
      label: 'low bridge',
    },
  ])

  console.log('[seed] Successfully pre-seeded Floor 1 map.');
}
