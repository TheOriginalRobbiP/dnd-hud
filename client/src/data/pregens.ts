// ── Pre-generated Crawlers ────────────────────────────────────
// Each pregen has a fixed identity, stats, skills, and portrait.
// The player only provides their real name when selecting one.

export interface PregenCrawler {
  crawlerName: string
  portrait: string
  tagline: string
  preJob: string
  stats: { STR: number; DEX: number; CON: number; INT: number; CHA: number; WIS: number }
  maxHp: number
  maxMp: number
  skills: { name: string; level: number; effortType: 'basic' | 'weapon' | 'magic' }[]
  notes: string
  inventory?: any[]
}

export const PREGENS: PregenCrawler[] = [
  {
    crawlerName: 'DORIS',
    portrait: '/images/crawlers/doris.png',
    tagline: 'The one who\'s done all the reading.',
    preJob: 'Retired librarian and amateur conspiracy theorist',
    stats: { STR: 2, DEX: 3, CON: 3, INT: 6, CHA: 5, WIS: 4 },
    maxHp: 8,
    maxMp: 8,
    skills: [
      { name: 'Research', level: 3, effortType: 'basic' },
      { name: 'Persuasion', level: 3, effortType: 'basic' },
      { name: 'Trap Detection', level: 2, effortType: 'basic' },
      { name: 'Unarmed Combat', level: 3, effortType: 'weapon' },
      { name: 'Arcane Bolt', level: 1, effortType: 'magic' },
    ],
    inventory: [
      { name: "Leather Handbag", description: "Heavy. Something inside it — she won't say what. Weapon effort in melee.", tier: 'uncommon', isEquipped: true, equippedSlot: 'mainHand', fromLootBox: false, lootBoxTier: null },
      { name: "Reading Glasses", description: "+1 INT when worn. She doesn't need them for dungeon crawling. She's keeping them on.", tier: 'common', isEquipped: true, equippedSlot: 'face', fromLootBox: false, lootBoxTier: null },
      { name: "Werther's Original", description: "Heals 1 HP. She has several. Non-stackable (dignity reasons).", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null, isConsumable: true, hpEffect: 1, charges: null },
      { name: "Werther's Original", description: "Heals 1 HP.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null, isConsumable: true, hpEffect: 1, charges: null },
      { name: "Werther's Original", description: "Heals 1 HP.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null, isConsumable: true, hpEffect: 1, charges: null },
    ],
    notes: 'Pre-dungeon: Retired librarian. Has read three books about dungeons. Insists this gives her an advantage.',
  },
  {
    crawlerName: 'MILES',
    portrait: '/images/crawlers/miles.png',
    tagline: 'Arrived holding a glowing drink. Still holding it.',
    preJob: 'Barback at a dive bar with questionable health violations',
    stats: { STR: 3, DEX: 6, CON: 3, INT: 4, CHA: 4, WIS: 4 },
    maxHp: 8,
    maxMp: 4,
    skills: [
      { name: 'Stealth', level: 3, effortType: 'basic' },
      { name: 'Sleight of Hand', level: 3, effortType: 'basic' },
      { name: 'Knife Fighting', level: 3, effortType: 'weapon' },
      { name: 'Unarmed Combat', level: 3, effortType: 'weapon' },
      { name: 'Lockpicking', level: 2, effortType: 'basic' },
    ],
    inventory: [
      { name: "High-Vis Vest", description: "Chest slot. +2 to being spotted (good or bad). The System has flagged this as valid equipment. No one knows why.", tier: 'common', isEquipped: true, equippedSlot: 'chest', fromLootBox: false, lootBoxTier: null },
      { name: "Key Fob (Van, No Van)", description: "He still has the key. The van is gone. The wetware won't let him delete it.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
      { name: "Thermos (Coffee, Lukewarm)", description: "3 uses. Each use: restore 1 MP or gain Focused Buff (+1 to next INT roll).", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null, isConsumable: true, mpEffect: 1, charges: 3 },
    ],
    notes: 'Pre-dungeon: Barback. Nobody knows what\'s in the glowing cyan drink. Including Miles.',
  },
  {
    crawlerName: 'FLEX',
    portrait: '/images/crawlers/flex.png',
    tagline: 'Built like a question, answers with his fists.',
    preJob: 'Competitive strongman, semi-professional arm wrestler',
    stats: { STR: 6, DEX: 2, CON: 5, INT: 2, CHA: 4, WIS: 4 },
    maxHp: 14,
    maxMp: 0,
    skills: [
      { name: 'Unarmed Combat', level: 3, effortType: 'weapon' },
      { name: 'Bashing Weapons', level: 3, effortType: 'weapon' },
      { name: 'Intimidation', level: 3, effortType: 'basic' },
      { name: 'Athletics', level: 3, effortType: 'basic' },
      { name: 'Endurance', level: 2, effortType: 'basic' },
    ],
    inventory: [
      { name: "Protein Shaker (Empty)", description: "Heavy plastic. Weapon (basic effort). Can be refilled from dungeon water sources for unclear benefit.", tier: 'common', isEquipped: true, equippedSlot: 'offHand', fromLootBox: false, lootBoxTier: null },
      { name: "Resistance Band", description: "5m of latex. Utility — tie things, trip things, makeshift tourniquet.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
      { name: "Gym Vest", description: "Chest slot. No armour value. +1 CHA. Impressively cut.", tier: 'common', isEquipped: true, equippedSlot: 'chest', fromLootBox: false, lootBoxTier: null },
    ],
    notes: 'Pre-dungeon: Strongman competitor. Currently holds three regional arm-wrestling titles. Plans to win a fourth.',
  },
  {
    crawlerName: 'QUILL',
    portrait: '/images/crawlers/quill.png',
    tagline: 'Taking notes. Panicking. Taking more notes.',
    preJob: 'Freelance journalist covering local government meetings',
    stats: { STR: 2, DEX: 4, CON: 2, INT: 5, CHA: 4, WIS: 4 },
    maxHp: 6,
    maxMp: 6,
    skills: [
      { name: 'Research', level: 3, effortType: 'basic' },
      { name: 'Observation', level: 3, effortType: 'basic' },
      { name: 'Unarmed Combat', level: 3, effortType: 'weapon' },
      { name: 'First Aid', level: 2, effortType: 'basic' },
      { name: 'Charm', level: 2, effortType: 'basic' },
      { name: 'Identify', level: 1, effortType: 'magic' },
    ],
    inventory: [
      { name: "Library Cardigan", description: "Chest slot. +1 INT. Smells of old books. She won't take it off.", tier: 'common', isEquipped: true, equippedSlot: 'chest', fromLootBox: false, lootBoxTier: null },
      { name: "Notebook & Pen", description: "She's been writing everything down since the sky cracked. The wetware offers digital notes. She prefers paper.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
      { name: "Reading Light (Clip-On)", description: "5-hour battery. Useful in dark rooms. She brought it for her commute book.", tier: 'common', isEquipped: false, equippedSlot: null, fromLootBox: false, lootBoxTier: null },
    ],
    notes: 'Pre-dungeon: Journalist. The notebook is already half full of observations. She will not stop writing.',
  },
  {
    crawlerName: 'REX',
    portrait: '/images/crawlers/rex.png',
    tagline: 'Has seen worse. Won\'t say when.',
    preJob: 'Ex-military logistics coordinator, two tours unspecified',
    stats: { STR: 5, DEX: 4, CON: 5, INT: 3, CHA: 2, WIS: 4 },
    maxHp: 13,
    maxMp: 0,
    skills: [
      { name: 'Unarmed Combat', level: 3, effortType: 'weapon' },
      { name: 'Ranged Weapons', level: 3, effortType: 'weapon' },
      { name: 'Tactics', level: 3, effortType: 'basic' },
      { name: 'Endurance', level: 3, effortType: 'basic' },
      { name: 'Survival', level: 2, effortType: 'basic' },
    ],
    notes: 'Pre-dungeon: Ex-military. Will not discuss which branch. Will not discuss what happened. Will discuss exit routes.',
  },
  {
    crawlerName: 'SUGAR',
    portrait: '/images/crawlers/sugar.png',
    tagline: 'Genuinely excited. That\'s the scary part.',
    preJob: 'Extreme sports influencer, 340k followers',
    stats: { STR: 3, DEX: 5, CON: 4, INT: 3, CHA: 6, WIS: 4 },
    maxHp: 10,
    maxMp: 0,
    skills: [
      { name: 'Unarmed Combat', level: 3, effortType: 'weapon' },
      { name: 'Acrobatics', level: 3, effortType: 'basic' },
      { name: 'Persuasion', level: 3, effortType: 'basic' },
      { name: 'Athletics', level: 2, effortType: 'basic' },
      { name: 'Bladed Weapons', level: 3, effortType: 'weapon' },
    ],
    notes: 'Pre-dungeon: Influencer. Already thinking about content. Terrifyingly good at making people like her.',
  },
  {
    crawlerName: 'VANCE',
    portrait: '/images/crawlers/vance.png',
    tagline: 'Trust him. No, seriously. Trust him.',
    preJob: 'Sales director, automotive sector, three fraud allegations dropped',
    stats: { STR: 2, DEX: 3, CON: 3, INT: 4, CHA: 6, WIS: 4 },
    maxHp: 8,
    maxMp: 4,
    skills: [
      { name: 'Unarmed Combat', level: 3, effortType: 'weapon' },
      { name: 'Persuasion', level: 3, effortType: 'basic' },
      { name: 'Deception', level: 3, effortType: 'basic' },
      { name: 'Negotiation', level: 3, effortType: 'basic' },
      { name: 'Appraise', level: 2, effortType: 'basic' },
      { name: 'Charm', level: 2, effortType: 'basic' },
    ],
    notes: 'Pre-dungeon: Sales director. Three fraud allegations, all dropped. Very insistent that they were dropped.',
  },
]
