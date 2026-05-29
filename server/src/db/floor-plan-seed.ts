import { db } from './client.js'
import { floorPlans, floorRooms, roomConnections } from './schema.js'
import { eq } from 'drizzle-orm'

export async function seedFloorPlans() {
  console.log('[seed] Wiping old floor plans and connections (cascade)...')
  await db.delete(floorPlans)

  console.log('[seed] Pre-seeding Floor 1: "The Antechamber" (DCC 8-Sector Storyline Progression)...')

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
      name: 'Sector 1 — Arrival Chamber',
      description: 'The elevator shafts collapsed, plunging you into the cold sewers of the dungeon. Shattered concrete blocks, twisted cables, and crushed Earth vehicles litter the floor. Floating high-tech blue holographic Borant Corp ads cast a sickening glow.\n\n### CHIEF OBJECTIVE\nYour wetware is un-stabilized. You must crawl through the dark service tunnels to locate the glowing green registration terminal of the **Tutorial Guild** (Sector 4) to activate your character sheets, select classes, and unlock your inventories!\n\n### INITIAL TUNNEL FORK\nYou can proceed either through **The Corridor Market** (Sector 2 - Tunnel A) or squeeze into **The Ventilation Shafts** (Sector 3 - Tunnel B Shortcut).\n\n### INITIAL ENCOUNTER\n2x **Hatchling Rust Swarms** (very weak mechanical insects). DC 10.',
      sceneArt: '/images/rooms/sector1_arrival_scene.png',
      battlemapArt: '/images/rooms/sector1_arrival_battlemap.png',
      roomTarget: 10,
      tags: 'start',
      posX: 100,
      posY: 220,
    },
    {
      name: 'Sector 2 — The Corridor Market',
      description: 'A tiled subway maintenance corridor flashing with green fluorescent tubes. Heavy **System Merchandise Exchange vending machines** line the walls, flashing inflated prices. A canine Bopca guard watches from the shadows.\n\n### SYSTEM VENDING\nYou can attempt to hack the vending machines (DC 12 Thievery) or barter with the Bopca guard (DC 11 CHA).\n\n### GUARDIAN MARKERS\n2x **Gryla\'s Babes** (green, screeching goblin infants) are chewing on the copper wiring. Killing them triggers Gryla\'s permanent campaign rage and populates the bone pile!',
      sceneArt: '/images/rooms/sector2_corridor_scene.png',
      battlemapArt: '/images/rooms/sector2_corridor_battlemap.png',
      roomTarget: 11,
      tags: 'vending,hazard',
      posX: 350,
      posY: 100,
    },
    {
      name: 'Sector 3 — The Ventilation Shafts',
      description: 'A dusty, narrow emergency ventilation duct. Cobwebs hang thick, and you can hear the clicking of mandibles inside the dark metal shaft.\n\n### THE TRAP: SPORE VENTS & MOTHS\nTripping the rusty laser sensors (DC 11 DEX to spot/disable) triggers the ventilation valves to blast open, releasing a cloud of acidic spores and a swarm of **Decay Moths**.\n\n### EQUIPMENT DEGRADATION\nDecay Moths eat equipment and apply the *Pocket Full of Holes* debuff, causing you to drop inventory items until you replace your armor at Sector 2.',
      sceneArt: '/images/rooms/sector3_ventilation_scene.png',
      battlemapArt: '/images/rooms/sector3_ventilation_battlemap.png',
      roomTarget: 11,
      tags: 'trap,shortcut',
      posX: 350,
      posY: 220,
    },
    {
      name: 'Sector 4 — The Tutorial Guild',
      description: 'A sleek, chrome-and-steel Syndicate facility bolted directly into the cavern bedrock. In the center, a pedestal features a green glowing terminal reading **"SYSTEM CLASS SELECTION"**.\n\n### REGISTRATION STATION\nTouch the screen to stabilize your wetware! All crawlers can select starting classes (Doris, Flex, Quill, Miles), activate their starter gear/skills, and unlock their VTT inventory slots!\n\n### APTITUDE REWARDS\nRegistering awards your **Bronze Class Loot Box**.',
      sceneArt: '/images/rooms/sector3_guild_scene.png',
      battlemapArt: '/images/rooms/sector3_guild_battlemap.png',
      roomTarget: 10,
      tags: 'safe,guild',
      posX: 350,
      posY: 340,
    },
    {
      name: 'Sector 5 — The Security Checkpoint',
      description: 'A corporate toll-booth blockading the central junction leading deeper into the floor. Floating laser emitter arrays cast a red laser grid barrier across the path, and a security camera drone watches.\n\n### THE TERMINAL TOLL\nThe gate demands "10 Gold per Crawler" or a valid biometric scan.\n\n### BYPASS CHECKS\nYou can pay, attempt to hack the console (DC 13 INT/Thievery), or sneak past camera blind spots. Failure triggers a **High-Voltage Taser Trap** (1d6 electrical damage) and alerts nearby **Queue Jumpers** (displacement gremlins).',
      sceneArt: '/images/rooms/sector5_checkpoint_scene.png',
      battlemapArt: '/images/rooms/sector5_checkpoint_battlemap.png',
      roomTarget: 12,
      tags: 'trap,puzzle',
      posX: 600,
      posY: 340,
    },
    {
      name: 'Sector 6 — The Goblin Trash Nest',
      description: 'A trash-filled natural cavern packed with hoarded human garbage (crushed beer cans, old suitcases, plastic waste). Flashing red emergency alarm lights indicate a hostile threat has marked you.\n\n### BOSS ENCOUNTER: GRYLA\'S FAVORITE CHILD\n**Gryla\'s Favorite Child** (a hulking, rage-gland-infected goblin berserker wearing a dirty football helmet) commands this nest alongside 2x **Goblin Scouts**.\n\n### LORE CONSEQUENCES\nKilling Gryla\'s favorite child grants a Bronze Loot Box, but flags you with **"Gryla\'s Target"** (permanent campaign modifier). His bones will be harvested by the Bone Collector!',
      sceneArt: '/images/rooms/sector4_nest_scene.png',
      battlemapArt: '/images/rooms/sector4_nest_battlemap.png',
      roomTarget: 12,
      tags: 'mob-room,boss',
      posX: 850,
      posY: 340,
      mobTemplateIds: 'Goblin Scout,Goblin Shaman',
    },
    {
      name: 'Sector 7 — The Borant Disposal Chute',
      description: 'A slide where upper-level offices dump discarded corporate paperwork, shredded documents, and defective products into the side of the Goblin Trash Nest.\n\n### THE ENCOUNTER: THE CHEROMB NURSERY\nA cluster of sad, volatile **Cherombs** sitting in a pile of corporate documents.\n\n### THE RISK/REWARD SCRAP\nYou can search the trash for high-value gear (Borant\'s garbage is your treasure), but avoid insulting the depressed Cherombs to prevent a massive chain-reaction explosion!',
      sceneArt: '/images/rooms/sector7_disposal_scene.png',
      battlemapArt: '/images/rooms/sector7_disposal_battlemap.png',
      roomTarget: 10,
      tags: 'safe,loot-room',
      posX: 850,
      posY: 460,
    },
    {
      name: 'Sector 8 — The Subway Platform',
      description: 'A ruined, tiled subway platform. A bottomless, pitch-black chasm splits the concrete tracks, bridged only by a rusted, derailed subway train car. At the far side is a glowing green sign: **"STAIRWELL TO FLOOR 2: THE CASTLE FLOOR"**.\n\n### FLOOR BOSS: THE BONE COLLECTOR\nA towering, multi-limbed monstrosity made of interlocking skeletal frames patrols the exit platform.\n\n### SPECIAL MECHANIC: BONE HARVEST\nDuring combat, the Bone Collector will harvest the bones of any goblins/mobs you killed in Sector 2 or 6, summoning them as **Skeletal Goblins** directly onto the derailed subway tracks, blocking player movement. You must fight across the train car to reach the exit stairwell.',
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
      lootTier: r.name.includes('Guild') ? 'bronze' : r.name.includes('Nest') ? 'bronze' : r.name.includes('Chute') ? 'silver' : null,
      posX: r.posX,
      posY: r.posY,
      isVisited: r.name.includes('Arrival'),
      isCurrentRoom: r.name.includes('Arrival'), // Default start in Sector 1
    }).returning()
    createdRooms.push(room)
  }

  // 3. Connect Rooms (Choice of tunnels -> Tutorial Guild -> Rest of the floor)
  const room = (name: string) => createdRooms.find(r => r.name.includes(name))!

  await db.insert(roomConnections).values([
    {
      floorPlanId: plan.id,
      fromRoomId: room('Arrival').id,
      toRoomId: room('Corridor Market').id,
      label: 'maintenance corridor',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Arrival').id,
      toRoomId: room('Ventilation Shafts').id,
      label: 'rusty ventilation hatch',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Corridor Market').id,
      toRoomId: room('Tutorial Guild').id,
      label: 'neon-lit corridors',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Ventilation Shafts').id,
      toRoomId: room('Tutorial Guild').id,
      label: 'exhaust grate exit',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Tutorial Guild').id,
      toRoomId: room('Security Checkpoint').id,
      label: 'toll corridor',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Security Checkpoint').id,
      toRoomId: room('Goblin Trash Nest').id,
      label: 'security blast gate',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Goblin Trash Nest').id,
      toRoomId: room('Disposal Chute').id,
      label: 'trash disposal pipe',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Disposal Chute').id,
      toRoomId: room('Subway Platform').id,
      label: 'ventilation slide',
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

  console.log('[seed] Successfully pre-seeded Floor 1: Antechamber DCC 8-sector map.');
}
