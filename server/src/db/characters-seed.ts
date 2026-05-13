import { db } from './client.js'
import { characters } from './schema.js'
import * as dotenv from 'dotenv'
dotenv.config()

const crawlers = [
  {
    crawlerName: 'DORIS',
    playerName: 'Player 1',
    hp: 16, maxHp: 16, mp: 0, maxMp: 0,
    stats: { STR: 3, DEX: 3, CON: 7, INT: 4, CHA: 5 },
    skills: [
      { id: crypto.randomUUID(), name: 'Pattern Recognition', level: 7, specialisation: null,
        description: 'Decades of bingo cards. Notices things others miss — trap patterns, enemy tells, shortcut routes.', effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Crowd Management', level: 5, specialisation: null,
        description: 'Can de-escalate or redirect a group of 200 rowdy pensioners. Mobs are easier.', effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Handbag', level: 4, specialisation: null,
        description: 'The bag is real leather. The bag has seen things. Weapon effort.', effortType: 'weapon' },
      { id: crypto.randomUUID(), name: 'Sheer Bloody Stubbornness', level: 6, specialisation: null,
        description: 'Ignore pain. Ignore fear. Keep going. Once per session: refuse a killing blow, survive on 1 HP instead.', effortType: 'basic' },
    ],
    inventory: [
      { id: crypto.randomUUID(), name: "Leather Handbag", description: "Heavy. Something inside it — she won't say what. Weapon effort in melee.", tier: 'uncommon', isEquipped: true, equippedSlot: 'mainHand', fromLootBox: false, lootBoxTier: null },
      { id: crypto.randomUUID(), name: "Reading Glasses", description: "+1 INT when worn. She doesn't need them for dungeon crawling. She's keeping them on.", tier: 'common', isEquipped: true, equippedSlot: 'face', fromLootBox: false, lootBoxTier: null },
      { id: crypto.randomUUID(), name: "Werther's Original", description: "Heals 1 HP. She has several. Non-stackable (dignity reasons).", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
      { id: crypto.randomUUID(), name: "Werther's Original", description: "Heals 1 HP.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
      { id: crypto.randomUUID(), name: "Werther's Original", description: "Heals 1 HP.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
    ],
    viewerCount: 1240,
    notes: "Retired bingo hall manager from Wolverhampton. 67. Three recessions, two divorces, one dungeon. She has a son who was in a different sector when the sky cracked. She doesn't talk about it. She keeps moving. BEGINNER FRIENDLY: high HP, forgiving, readable skills.",
  },
  {
    crawlerName: 'FLEX',
    playerName: 'Player 2',
    hp: 14, maxHp: 14, mp: 0, maxMp: 0,
    stats: { STR: 8, DEX: 5, CON: 5, INT: 2, CHA: 4 },
    skills: [
      { id: crypto.randomUUID(), name: 'Unarmed Combat', level: 5, specialisation: null,
        description: 'Self-taught from YouTube. More effective than it has any right to be.', effortType: 'weapon' },
      { id: crypto.randomUUID(), name: 'Spotting', level: 6, specialisation: null,
        description: "Reading someone's form. Applicable to mobs — can tell from posture how they're about to attack.", effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Motivational Shouting', level: 7, specialisation: null,
        description: "Allies within earshot get +1 to their next roll. FLEX doesn't understand why this works on literal monsters too.", effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Protein Shake Consumption', level: 9, specialisation: null,
        description: "He had one in his hand when the sky opened. The wetware catalogued it. He's as baffled as you are.", effortType: 'basic' },
    ],
    inventory: [
      { id: crypto.randomUUID(), name: "Protein Shaker (Empty)", description: "Heavy plastic. Weapon (basic effort). Can be refilled from dungeon water sources for unclear benefit.", tier: 'common', isEquipped: true, equippedSlot: 'offHand', fromLootBox: false, lootBoxTier: null },
      { id: crypto.randomUUID(), name: "Resistance Band", description: "5m of latex. Utility — tie things, trip things, makeshift tourniquet.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
      { id: crypto.randomUUID(), name: "Gym Vest", description: "Chest slot. No armour value. +1 CHA. Impressively cut.", tier: 'common', isEquipped: true, equippedSlot: 'chest', fromLootBox: false, lootBoxTier: null },
    ],
    viewerCount: 980,
    notes: "Personal trainer. Was with a client when it happened. Doesn't know if she made it. Keeps training because stopping means thinking about it. INT 2 — magic permanently unavailable (wetware flag: insufficient processing power). INTERMEDIATE: hits very hard, needs someone watching his back.",
  },
  {
    crawlerName: 'QUILL',
    playerName: 'Player 3',
    hp: 9, maxHp: 9, mp: 8, maxMp: 8,
    stats: { STR: 2, DEX: 4, CON: 3, INT: 8, CHA: 4 },
    skills: [
      { id: crypto.randomUUID(), name: 'Monster Lore', level: 6, specialisation: null,
        description: "Knows the weaknesses, habits, and breeding cycles of most dungeon creatures. The knowledge has never once made her less terrified.", effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Cataloguing', level: 7, specialisation: null,
        description: "Index, classify, cross-reference anything. Finds patterns in dungeon layouts other crawlers miss.", effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Minor Arcana', level: 3, specialisation: null,
        description: "Cantrips: light, small force, identification. She's been reading about the bigger spells. She is not ready.", effortType: 'magic' },
      { id: crypto.randomUUID(), name: 'Quiet Panic', level: 5, specialisation: null,
        description: "Perform complex tasks while visibly terrified. +200 viewers whenever she succeeds on a roll she clearly didn't expect to make.", effortType: 'basic' },
    ],
    inventory: [
      { id: crypto.randomUUID(), name: "Library Cardigan", description: "Chest slot. +1 INT. Smells of old books. She won't take it off.", tier: 'common', isEquipped: true, equippedSlot: 'chest', fromLootBox: false, lootBoxTier: null },
      { id: crypto.randomUUID(), name: "Notebook & Pen", description: "She's been writing everything down since the sky cracked. The wetware offers digital notes. She prefers paper.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
      { id: crypto.randomUUID(), name: "Reading Light (Clip-On)", description: "5-hour battery. Useful in dark rooms. She brought it for her commute book.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
    ],
    viewerCount: 1450,
    notes: "Librarian. 22 years of catalogue work, 40,000 books — all gone. She's cataloguing the dungeon instead. Highest viewer count (the audience already has a favourite). ADVANCED: fragile, magic potential, high skill ceiling. Protect her.",
  },
  {
    crawlerName: 'MILES',
    playerName: 'Player 4',
    hp: 12, maxHp: 12, mp: 0, maxMp: 0,
    stats: { STR: 4, DEX: 7, CON: 4, INT: 4, CHA: 3 },
    skills: [
      { id: crypto.randomUUID(), name: 'Route Planning', level: 8, specialisation: null,
        description: "Find the fastest path between any two points. In the dungeon: exits, shortcuts, ambush positions.", effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Defensive Driving', level: 6, specialisation: null,
        description: "Anticipate what's about to go wrong and move before it does. Dodge bonus on the first attack of any encounter.", effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Staying Calm', level: 9, specialisation: null,
        description: "Unnatural composure. Immune to Panic debuff. Makes everyone around him slightly calmer too.", effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Parcels', level: 4, specialisation: null,
        description: "47,000 successful deliveries, 3 complaints. The wetware logged it. Applicable skill unclear. He's working on it.", effortType: 'basic' },
    ],
    inventory: [
      { id: crypto.randomUUID(), name: "High-Vis Vest", description: "Chest slot. +2 to being spotted (good or bad). The System has flagged this as valid equipment. No one knows why.", tier: 'common', isEquipped: true, equippedSlot: 'chest', fromLootBox: false, lootBoxTier: null },
      { id: crypto.randomUUID(), name: "Key Fob (Van, No Van)", description: "He still has the key. The van is gone. The wetware won't let him delete it.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
      { id: crypto.randomUUID(), name: "Thermos (Coffee, Lukewarm)", description: "3 uses. Each use: restore 1 MP or gain Focused Buff (+1 to next INT roll).", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
    ],
    viewerCount: 1100,
    notes: "Delivery driver. Has 6 deliveries left on his route. Keeps checking his phone to see if the app updated. It hasn't. He's going to finish the route. He doesn't know what that means down here. BEGINNER FRIENDLY: utility, hard to panic, clear role.",
  },
]

async function seed() {
  // Wipe and reseed — character setup pass
  await db.delete(characters)
  console.log('[seed] Cleared existing characters.')

  for (const c of crawlers) {
    await db.insert(characters).values({
      crawlerName: c.crawlerName,
      playerName: c.playerName,
      hp: c.hp, maxHp: c.maxHp,
      mp: c.mp, maxMp: c.maxMp,
      stats: c.stats,
      skills: c.skills,
      equipment: {
        head: null, face: null, neck: null, chest: null,
        arms: null, hands: null, fingers: null, legs: null,
        feet: null, toes: null, nipples: null,
        mainHand: null, offHand: null,
      },
      inventory: c.inventory,
      achievements: [],
      viewerCount: c.viewerCount,
      sponsors: [],
      statusEffects: [],
      notes: c.notes,
      isAlive: true,
    })
    console.log(`[seed] Created: ${c.crawlerName} — ${c.notes.split('.')[0]}`)
  }
  console.log('[seed] Done. 4 crawlers ready for The Commons.')
  process.exit(0)
}

seed().catch(err => { console.error('[seed] Error:', err); process.exit(1) })
