import { db } from './client.js'
import { floorPlans, floorRooms, roomConnections } from './schema.js'

export async function seedFloorPlans() {
  console.log('[seed] Wiping old floor plans and connections (cascade)...')
  await db.delete(floorPlans)

  console.log('[seed] Pre-seeding Floor 1: "The Antechamber" (DCC Canonical Atlas Realignment)...')

  // 1. Insert Floor 1 Plan
  const [plan] = await db.insert(floorPlans).values({
    name: 'Floor 1 — The Antechamber',
    theme: 'the-commons',
    themeColour: '#f59e0b',
    isActive: true, // Active by default
  }).returning()

  // 2. Insert Rooms with Czepeku-style DCC Scene & Battlemap pairs
  const roomsData = [
    {
      name: 'Sector 1 — Arrival Sewer & Outskirts',
      description: 'You wake up in a collapsed concrete drainage pipe covered in sludge and debris. Flashing blue holographic advertisements cast a sickening corporate glow. In your eyes, chaotic unformatted green warnings flash across your vision, blocking your items, abilities, and inventory slots.\n\n### CHIEF OBJECTIVE\nYour wetware is un-stabilized! You must navigate through the sewer pipes to find the heavy security doors of **The Tutorial Guild (Sector 2)** to register as a crawler and activate your full VTT character sheets!\n\n### FIRST COMBAT ENCOUNTER\n2x **Hatchling Rust Swarms** (very weak mechanical insects) are chewing on copper wiring. Since your HUD is locked, you must execute raw **Attribute Checks** (STR to punch, DEX to dodge/slip past) to survive!',
      sceneArt: '/images/rooms/f1_arrival_sewer_scene.png',
      battlemapArt: '/images/rooms/f1_arrival_sewer_battlemap.png',
      roomTarget: 10,
      tags: 'start',
      posX: 100,
      posY: 220,
      mobTemplateIds: 'Hatchling Rust Swarm',
    },
    {
      name: 'Sector 2 — The Tutorial Guild',
      description: 'A heavy metal security door protected behind a shimmering blue **Traefik Forcefield** (which vaporizes any chasing mobs). Written in crude, neon green paint on the door is a hand-written sign: **"TUTORIAL GUILD"**.\n\n### THE STABILIZATION MOMENT\nStep up to the green terminal inside the safe room! The flashing Borant Corp warnings in your eyes will shatter and vanish. Your full VTT inventory, item grids, and actions light up in glowing orange!\n\n### REGISTRATION REWARDS\nStabilizing automatically registers you under the default **Human Class** (Class Selection unlocks on Floor 3) and awards your **Starter Class Loot Box** directly into your inventory!\n\n### CHATTER & FAQs: MORDECAI\nA holographic projection of **Mordecai** (your cynical, chain-smoking Guide) flickers on. Here is his quick-access FAQ cheat-sheet:\n- **Choosing Race/Class:** "You\'re a default Human. Choose species and class at Level 3 in the Floor 3 Over City."\n- **How Skills Work:** "Click a skill to load into the Action Roller. Roll d20 vs Room Target, then roll effort dice."\n- **How the Dungeon Works:** "18-level televised game show. Timer hits zero = level collapse. Run or get compressed into organic paste."\n- **Loot Boxes:** "Digital rewards from System AI or sponsors. Can ONLY be opened inside secure Safe Rooms."',
      sceneArt: '/images/rooms/f1_tutorial_guild_scene.png',
      battlemapArt: '/images/rooms/f1_tutorial_guild_battlemap.png',
      roomTarget: 10,
      tags: 'safe,guild',
      posX: 300,
      posY: 220,
    },
    {
      name: 'Sector 3 — The Corridor Market',
      description: 'A tiled subway maintenance tunnel flashing with green fluorescent lights. Heavy, flashing **System Merchandise Exchange vending machines** line the walls, flashing inflated prices. A canine Bopca guard watches from the shadows.\n\n### CHATTER & TRADE: SERGEANT BARKLES\nYou meet **Guard Sergeant Barkles** (a weary bipedal golden retriever in a dirty security uniform) eating a dry biscuit. Talk to him for gossip about the Goblins in Sector 6 or to trade. He can give you hints about the roach hazard in Sector 7!\n\n### SYSTEM VENDING\nYou can attempt to hack the vending machines (DC 12 Thievery) or barter with Sergeant Barkles (DC 11 CHA).',
      sceneArt: '/images/rooms/f1_corridor_market_scene.png',
      battlemapArt: '/images/rooms/f1_corridor_market_battlemap.png',
      roomTarget: 11,
      tags: 'vending,safe',
      posX: 500,
      posY: 100,
    },
    {
      name: 'Sector 4 — The Ventilation Shafts',
      description: 'You are crawling through a dark, dusty, narrow metal air duct lined with rust. Thick cobwebs hang from motionless ventilation fans.\n\n### THE TRAP: SPORE VENTS & MOTHS\nTripping the rusty laser sensors (DC 11 DEX to spot/disable) triggers the ventilation valves to blast open, releasing a cloud of acidic spores and a swarm of **Decay Moths**.\n\n### EQUIPMENT DEGRADATION\nDecay Moths apply the *Pocket Full of Holes* debuff, causing random unequipped items to fall out of your bag until you clear the debuff in a Safe Room!',
      sceneArt: '/images/rooms/f1_ventilation_shafts_scene.png',
      battlemapArt: '/images/rooms/f1_ventilation_shafts_battlemap.png',
      roomTarget: 11,
      tags: 'trap,shortcut',
      posX: 500,
      posY: 340,
      mobTemplateIds: 'Decay Moths',
    },
    {
      name: 'Sector 5 — The Caravan Park',
      description: 'A massive open cavern crammed with retro mobile homes and caravan trailers, littered with Burger King wrappers and empty cans of Full Throttle. This is the heart of the Goblin Neighborhood.\n\n### THE MORAL CHOICE\nIn a cardboard box, you hear cooing. Inside are tiny, slimy green **Goblin Babies**. If you blow them up, the System AI will be highly amused (granting +500 galactic views), but the entire neighborhood goes on permanent high alert, raising all room targets on the floor by +2!',
      sceneArt: '/images/rooms/f1_caravan_park_scene.png',
      battlemapArt: '/images/rooms/f1_caravan_park_battlemap.png',
      roomTarget: 11,
      tags: 'hazard,goblin',
      posX: 500,
      posY: 220,
      mobTemplateIds: 'Goblin Scout',
    },
    {
      name: 'Sector 6 — The Goblin Workshop',
      description: 'A cluttered workshop smelling of sulfur and gasoline, operated by Goblins. Stacks of crude explosives, pipes, and metal scrap cover every surface.\n\n### THE HAZARD: RED BARRELS\nThe workshop is packed with red barrels of **Funpowder**. A single stray fire spell or explosive will detonate the whole room, dealing massive fire damage to players and goblins alike!\n\n### COMBAT BEATS\nFace a **Goblin Engineer** (who throws pipe bombs) and a **Goblin Bomb Bard** who screams heavy-metal lute songs, buffing all goblins. Target the Bard first!',
      sceneArt: '/images/rooms/f1_goblin_workshop_scene.png',
      battlemapArt: '/images/rooms/f1_goblin_workshop_battlemap.png',
      roomTarget: 12,
      tags: 'mob-room,hazard',
      posX: 700,
      posY: 220,
      mobTemplateIds: 'Goblin Engineer,Goblin Bomb Bard',
    },
    {
      name: 'Sector 7 — The Disposal Chutes',
      description: 'A massive industrial garbage slide where upper-level offices dump corporate paperwork, shredded documents, and defective products into the sewer caverns.\n\n### CHATTER & TRAGEDY: BARNABY\nYou meet **Barnaby** (a tiny, sad, potato-shaped Cheromb) crying in a pile of shredded papers. Talk to him! You can cheer him up for information, or insult him severely (DC 11 CHA) to turn him into a volatile grenade (3d6 explosive damage)!\n\n### ENVIRONMENTAL HAZARD: TRASH AVALANCHE\nSearching the garbage piles for rare discarded loot requires a DC 11 Agility check. On a fail, a Trash Avalanche collapses, dealing 1d4 bludgeoning damage and burying your active weapon (requiring an action to retrieve)!',
      sceneArt: '/images/rooms/f1_disposal_chutes_scene.png',
      battlemapArt: '/images/rooms/f1_disposal_chutes_battlemap.png',
      roomTarget: 11,
      tags: 'loot-room,hazard',
      posX: 900,
      posY: 340,
      mobTemplateIds: 'Scatterer',
    },
    {
      name: 'Sector 8 — The Subway Platform',
      description: 'A ruined, tiled subway platform split in half by a bottomless chasm bridged only by a rusted, derailed subway train car. At the far side is the glowing green sign: **"STAIRWELL TO FLOOR 2: THE CASTLE FLOOR"**.\n\n### BOROUGH BOSS: THE HOARDER BOSS\nA massive, bloated genetic slug-beast made of unwashed clothes, old magazines, and corporate waste blocks the exit chasm.\n\n### COMBAT MECHANIC: SLIPPERY CHASM\nIf a player runs blindly across the train car bridge without caution, they must pass a DC 12 Agility (DEX) check or slip on oil, sliding toward the chasm edge!',
      sceneArt: '/images/rooms/f1_subway_platform_scene.png',
      battlemapArt: '/images/rooms/f1_subway_platform_battlemap.png',
      roomTarget: 14,
      tags: 'boss,exit',
      posX: 900,
      posY: 220,
      mobTemplateIds: 'The Hoarder Boss',
    },
  ]

  const createdRooms: any[] = []
  for (const r of roomsData) {
    const [room] = await db.insert(floorRooms).values({
      floorPlanId: plan.id,
      name: r.name,
      description: r.description,
      flavourArt: r.battlemapArt,
      sceneArt: r.sceneArt,
      battlemapArt: r.battlemapArt,
      roomTarget: r.roomTarget,
      tags: r.tags,
      mobTemplateIds: r.mobTemplateIds ?? '',
      lootTier: r.name.includes('Guild') ? 'bronze' : r.name.includes('Workshop') ? 'bronze' : r.name.includes('Chutes') ? 'silver' : null,
      posX: r.posX,
      posY: r.posY,
      isVisited: r.name.includes('Arrival'),
      isCurrentRoom: r.name.includes('Arrival'),
    }).returning()
    createdRooms.push(room)
  }

  // Connect Rooms
  const room = (name: string) => createdRooms.find(r => r.name.includes(name))!

  await db.insert(roomConnections).values([
    {
      floorPlanId: plan.id,
      fromRoomId: room('Arrival').id,
      toRoomId: room('Tutorial Guild').id,
      label: 'green flashing beacon',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Tutorial Guild').id,
      toRoomId: room('Corridor Market').id,
      label: 'commercial tunnel',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Tutorial Guild').id,
      toRoomId: room('Ventilation Shafts').id,
      label: 'exhaust duct',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Tutorial Guild').id,
      toRoomId: room('Caravan Park').id,
      label: 'ghetto passage',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Corridor Market').id,
      toRoomId: room('Workshop').id,
      label: 'workshop door',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Ventilation Shafts').id,
      toRoomId: room('Workshop').id,
      label: 'vent grate',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Caravan Park').id,
      toRoomId: room('Workshop').id,
      label: 'trailer park exit',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Workshop').id,
      toRoomId: room('Disposal Chutes').id,
      label: 'trash conveyor chute',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Workshop').id,
      toRoomId: room('Subway Platform').id,
      label: 'derailed tracks bypass',
    },
    {
      floorPlanId: plan.id,
      fromRoomId: room('Disposal Chutes').id,
      toRoomId: room('Subway Platform').id,
      label: 'sliding chute pipe',
    },
  ])

  console.log('[seed] Successfully pre-seeded Floor 1: Antechamber DCC canonical map.');

  console.log('[seed] Pre-seeding Floor 2: "The Castle Tutorial" (Canonical Krakaren Realignment)...');

  // 1. Insert Floor 2 Plan
  const [plan2] = await db.insert(floorPlans).values({
    name: 'Floor 2 — The Castle Tutorial',
    theme: 'iron-foundry',
    themeColour: '#991b1b',
    isActive: false, // Inactive by default, GM selects it
  }).returning()

  // 2. Insert Rooms
  const floor2RoomsData = [
    {
      name: 'Sector 1 — The Production Trailer',
      description: 'You exit the Floor 1 stairwell directly onto a high-tech chrome **Syndicate Production Trailer** floating on Earth\'s surface water. Shimmering Traefik shields render you 100% safe from monsters.\n\n### THE INTERVIEW EVENT\nYour HUD menus, inventory, and weapon controls are locked. You undergo a live guest appearance on **Dungeon Crawler World** or **After Hours with Odette**! Pitch your answers to their sassy questions. Based on your entertainment value, you will walk away with **Galactic Followers** and a **Silver Item Box** as you step back into the active dungeon halls!',
      sceneArt: '/images/rooms/f2_production_trailer_scene.png',
      battlemapArt: '/images/rooms/f2_production_trailer_battlemap.png',
      roomTarget: 10,
      tags: 'safe,hotel',
      posX: 100,
      posY: 220,
    },
    {
      name: 'Sector 2 — The White Lichen Halls',
      description: 'Sterile white stone tiled corridors with cinder block walls covered in glowing, wet orange lichen. Neon Syndicate ads blink along the stone arches. In the center, a flashing **Bounty Board** displays active crawler bounties.\n\n### CHATTER & QUEST: V\'KORMAS AEGISBANE\nYou meet **V\'Kormas Aegisbane** (an aged level 90 Orc Barbarian in a wizard robe) walking his skeletal mastiff **Poe** on a chain leash. He hates mages (especially Andrews) but is forced to use scrolls because his magic is terrible. You can teach him simple spells or trade spell scrolls for potions!',
      sceneArt: '/images/rooms/sector2_altar_scene.png',
      battlemapArt: '/images/rooms/sector2_altar_battlemap.png',
      roomTarget: 11,
      tags: 'trap,hazard',
      posX: 300,
      posY: 220,
    },
    {
      name: 'Sector 3 — The Appalachian Pine Trail',
      description: 'A massive simulated indoor mountain forest with towering pine trees, dirt paths, and an artificial sunset sky. Nailed to the trees are creepy framed Polaroids of Clurichauns.\n\n### CHATTER & ESCORT: FETIN THE FRUGAL FELINE\nYou meet **Fetin** (a level 42 Tabaxi chef) looking exhausted. He offers you a massive feast with permanent/temporary stat buffs if you help him collect Gecko Green Beans (guarded by geckos) and Minotoads.\n\n### THE AMBUSH TRAP\nThe Minotoads are hidden in a dark cavern. Entering it triggers a dangerous ambush by **Feral Gremlocks**!',
      sceneArt: '/images/rooms/f2_appalachian_trail_scene.png',
      battlemapArt: '/images/rooms/f2_appalachian_trail_battlemap.png',
      roomTarget: 11,
      tags: 'trap,combat',
      posX: 500,
      posY: 100,
      mobTemplateIds: 'Gremlock',
    },
    {
      name: 'Sector 4 — The Ruined Temple of the Mantis',
      description: 'Collapsed, ancient marble columns overgrown with glowing orange weeds.\n\n### CHATTER & CHIEFTAIN QUEST: JAYNE CABOOSE\nYou meet **Captain Jayne Caboose** (a very friendly, dim-witted level 50 guard in leather plate armor) investigating a headless corpse. \n\n### THE "KINK" ACHIEVEMENT\nIf a player reaches their arm down the neck-hole of the corpse (DC 13 STR/CON), they pull out the holy symbol, triggering the unhinged System AI achievement: **"No Kink Shaming"**. The clues lead to a rogue summoning ritual of a paper-mache Mantis Goddess, where Caboose must be rescued from being sacrificed!',
      sceneArt: '/images/rooms/sector2_altar_scene.png',
      battlemapArt: '/images/rooms/sector2_altar_battlemap.png',
      roomTarget: 12,
      tags: 'hazard,combat',
      posX: 500,
      posY: 340,
    },
    {
      name: 'Sector 5 — The Clurichaun Distillery',
      description: 'A rowdy settlement inside a ruined castle courtyard run by the Clurichaun Syndicate. Copper stills fill the air with thick alcohol fumes. This is a Safe Room.\n\n### SHOP & TRADING\nMeet **Seamus MacGuffin** behind the bar. You can buy specialized gear or drink **Clurichaun Moonshine** (restores HP/mana but inflicts a *Drunken Debuff* reducing DEX by -2).\n\n### THE SCRATCH-OFF SCAM\nShady merchants sell "discounted" scratch-offs (90% chance to blow up, 10% chance to win a Silver loot box).',
      sceneArt: '/images/rooms/f2_clurichaun_distillery_scene.png',
      battlemapArt: '/images/rooms/f2_clurichaun_distillery_battlemap.png',
      roomTarget: 11,
      tags: 'safe,vending',
      posX: 700,
      posY: 220,
    },
    {
      name: 'Sector 6 — The Krakaren Decoy Chamber',
      description: 'A magnificent, marble-lined gothic throne room that screams "BOSS ROOM." It is completely silent and packed with chest panels.\n\n### THE TRAP DAIS\nOpening a chest or stepping on the throne triggers massive floor fire-vents and dart traps (DC 12 Agility to dodge).\n\n### BOROUGH BOSS: THE KRAKAREN\nThe moment the trap triggers, **The Krakaren** (a giant mutant squid with a blocky blonde haircut and a screaming HOA attitude) crashes through the wall! She uses sonic screeching (silencing spells) and flings players across the room. Defeating her shatters the throne to reveal the exit stairs to Floor 3!',
      sceneArt: '/images/rooms/f2_krakaren_decoy_scene.png',
      battlemapArt: '/images/rooms/f2_krakaren_decoy_battlemap.png',
      roomTarget: 14,
      tags: 'boss,exit',
      posX: 900,
      posY: 220,
      mobTemplateIds: 'The Krakaren',
    }
  ]

  const createdFloor2Rooms: any[] = []
  for (const r of floor2RoomsData) {
    const [room] = await db.insert(floorRooms).values({
      floorPlanId: plan2.id,
      name: r.name,
      description: r.description,
      flavourArt: r.battlemapArt,
      sceneArt: r.sceneArt,
      battlemapArt: r.battlemapArt,
      roomTarget: r.roomTarget,
      tags: r.tags,
      mobTemplateIds: r.mobTemplateIds ?? '',
      lootTier: r.name.includes('Distillery') ? 'silver' : r.name.includes('Chamber') ? 'gold' : null,
      posX: r.posX,
      posY: r.posY,
      isVisited: r.name.includes('Trailer'),
      isCurrentRoom: r.name.includes('Trailer'),
    }).returning()
    createdFloor2Rooms.push(room)
  }

  const roomF2 = (name: string) => createdFloor2Rooms.find(r => r.name.includes(name))!

  await db.insert(roomConnections).values([
    {
      floorPlanId: plan2.id,
      fromRoomId: roomF2('Trailer').id,
      toRoomId: roomF2('White Lichen').id,
      label: 'crossroads hatch',
    },
    {
      floorPlanId: plan2.id,
      fromRoomId: roomF2('White Lichen').id,
      toRoomId: roomF2('Pine Trail').id,
      label: 'wooden archway',
    },
    {
      floorPlanId: plan2.id,
      fromRoomId: roomF2('White Lichen').id,
      toRoomId: roomF2('Mantis').id,
      label: 'ruined marble stairs',
    },
    {
      floorPlanId: plan2.id,
      fromRoomId: roomF2('Pine Trail').id,
      toRoomId: roomF2('Distillery').id,
      label: 'stone guard gate',
    },
    {
      floorPlanId: plan2.id,
      fromRoomId: roomF2('Mantis').id,
      toRoomId: roomF2('Distillery').id,
      label: 'distillery tunnel',
    },
    {
      floorPlanId: plan2.id,
      fromRoomId: roomF2('Distillery').id,
      toRoomId: roomF2('Chamber').id,
      label: 'gothic cathedral doors',
    }
  ])

  console.log('[seed] Successfully pre-seeded Floor 2: The Castle Tutorial.');
}
