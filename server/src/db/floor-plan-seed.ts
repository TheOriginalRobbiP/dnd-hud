import { db } from './client.js'
import { floorPlans, floorRooms, roomConnections } from './schema.js'
import { eq } from 'drizzle-orm'

export async function seedFloorPlans() {
  console.log('[seed] Wiping old floor plans and connections (cascade)...')
  await db.delete(floorPlans)

  console.log('[seed] Pre-seeding Floor 1: "The Commons" (DCC-Authentic Layout)...')

  // 1. Insert Floor Plan
  const [plan] = await db.insert(floorPlans).values({
    name: 'Floor 1 — The Antechamber',
    theme: 'the-commons',
    themeColour: '#f59e0b',
    isActive: true, // Active by default
  }).returning()

  // 2. Insert Rooms with Czepeku-style DCC Scene & Battlemap pairs
  const roomsData = [
    {
      name: 'Sector 1 — Arrival Cavern',
      description: 'The elevator shafts collapsed, plunging you into the cold sewers of the dungeon. Shattered concrete blocks, twisted cables, and crushed Earth vehicles litter the floor. Floating high-tech blue holographic Borant Corp ads cast a sickening glow.\n\n### CHIEF OBJECTIVE\nNavigate the rubble and locate the **System Tutorial Guild** to register your class and activate your starter kit!\n\n### INITIAL ENCOUNTER\n2x **Hatchling Rust Swarms** (very weak mechanical insects). DC 10.',
      sceneArt: '/images/rooms/sector1_arrival_scene.png',
      battlemapArt: '/images/rooms/sector1_arrival_battlemap.png',
      roomTarget: 10,
      tags: 'start,safe',
      posX: 100,
      posY: 220,
    },
    {
      name: 'Sector 2 — The Corridor Market',
      description: 'A tiled subway maintenance corridor flashing with green fluorescent tubes. Heavy **System Merchandise Exchange vending machines** line the walls, flashing inflated prices. A Borzoi-faced Bopca merchant officer in a corporate uniform watches from the shadows.\n\n### SYSTEM VENDING\nYou can attempt to hack the vending machines (DC 12 Thievery) or barter with the Bopca guard (DC 11 CHA).\n\n### GUARDIAN MARKERS\nBeware: 2x **Gryla\'s Babes** (green, screeching goblin infants) are chewing on wiring. Killing them triggers Gryla\'s permanent rage...',
      sceneArt: '/images/rooms/sector2_corridor_scene.png',
      battlemapArt: '/images/rooms/sector2_corridor_battlemap.png',
      roomTarget: 11,
      tags: 'vending,hazard',
      posX: 350,
      posY: 100,
    },
    {
      name: 'Sector 3 — The Tutorial Guild',
      description: 'A sleek, chrome-and-steel Syndicate facility bolted directly into the cavern bedrock. In the center, a pedestal features a green glowing terminal reading **"SYSTEM CLASS SELECTION"**.\n\n### REGISTRATION STATION\nAll crawlers can select their starting class, gain their Primary Skill, and unlock their wetware starter gear!\n\n### APTITUDE EXCLUSIVES\nRegistering awards your **Bronze Class Loot Box**.',
      sceneArt: '/images/rooms/sector3_guild_scene.png',
      battlemapArt: '/images/rooms/sector3_guild_battlemap.png',
      roomTarget: 10,
      tags: 'safe,guild',
      posX: 350,
      posY: 340,
    },
    {
      name: 'Sector 4 — The Goblin Trash Nest',
      description: 'A trash-filled natural cavern packed with hoarded Earth garbage (suits, crushed beer cans, luggage). Flashing red emergency alarm lights indicate a hostile threat has marked you.\n\n### BOSS ENCOUNTER: GRYLA\'S FAVORITE CHILD\n**Gryla\'s Favorite Child** (a hulking, rage-gland-infected goblin berserker wearing a dirty football helmet) commands this nest alongside 2x **Goblin Scouts**.\n\n### LORE CONSEQUENCES\nKilling Gryla\'s favorite child grants a Bronze Loot Box, but flags you with **"Gryla\'s Target"** (permanent campaign flag). His bones will be harvested by the Bone Collector!',
      sceneArt: '/images/rooms/sector4_nest_scene.png',
      battlemapArt: '/images/rooms/sector4_nest_battlemap.png',
      roomTarget: 12,
      tags: 'mob-room,boss',
      posX: 600,
      posY: 340,
      mobTemplateIds: 'Goblin Scout,Goblin Shaman',
    },
    {
      name: 'Sector 5 — The Subway Platform',
      description: 'A ruined, tiled subway platform. A bottomless, pitch-black chasm splits the concrete tracks, bridged only by a rusted, derailed subway train car. At the far side is a glowing green sign: **"STAIRWELL TO FLOOR 2: THE CASTLE FLOOR"**.\n\n### FLOOR BOSS: THE BONE COLLECTOR\nA towering, multi-limbed monstrosity made of interlocking skeletal frames patrols the exit platform.\n\n### SPECIAL MECHANIC: BONE HARVEST\nDuring combat, the Bone Collector will harvest the bones of any goblins/mobs you killed in Sector 2 or 4, summoning them as **Skeletal Goblins** mid-fight! You must cross the derailed subway car to reach the exit.',
      sceneArt: '/images/rooms/sector5_subway_scene.png',
      battlemapArt: '/images/rooms/sector5_subway_battlemap.png',
      roomTarget: 14,
      tags: 'boss,exit',
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
      lootTier: r.name.includes('Guild') ? 'bronze' : r.name.includes('Nest') ? 'bronze' : null,
      posX: r.posX,
      posY: r.posY,
      isVisited: r.name.includes('Arrival'),
      isCurrentRoom: r.name.includes('Arrival'), // Default start in Sector 1
    }).returning()
    createdRooms.push(room)
  }

  // 3. Connect Rooms (Semi-open DCC paths)
  const room = (name: string) => createdRooms.find(r => r.name.includes(name))!

  await db.insert(roomConnections).values([
    {
      floorPlanId: plan.id,
      fromRoomId: room('Arrival').id,
      toRoomId: room('Corridor Market').id,
      label: 'tiled maintenance tunnel',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Arrival').id,
      toRoomId: room('Goblin Trash Nest').id,
      label: 'garbage-strewn cavern',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Corridor Market').id,
      toRoomId: room('Tutorial Guild').id,
      label: 'neon-lit corridors',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Tutorial Guild').id,
      toRoomId: room('Goblin Trash Nest').id,
      label: 'locked blast-gate',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Goblin Trash Nest').id,
      toRoomId: room('Subway Platform').id,
      label: 'derailed subway tracks',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Tutorial Guild').id,
      toRoomId: room('Subway Platform').id,
      label: 'elevator shaft bypass',
    },
  ])

  console.log('[seed] Successfully pre-seeded Floor 1: Antechamber DCC map.');
}
