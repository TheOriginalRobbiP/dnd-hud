import { db } from './client.js'
import { characters } from './schema.js'
import * as dotenv from 'dotenv'
dotenv.config()

const crawlers = [
  {
    crawlerName: 'DORIS',
    playerName: 'Player 1',
    hp: 14, maxHp: 14, mp: 0, maxMp: 0,
    stats: { STR: 3, DEX: 4, CON: 6, INT: 3, CHA: 5, WIS: 4 },
    skills: [
      { id: crypto.randomUUID(), name: 'Bingo Card Reading', level: 7, description: 'Uncanny ability to spot patterns in chaos.', effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Handbag Deployment', level: 4, description: 'Dealing surprising weapon-effort damage with a handbag.', effortType: 'weapon' },
      { id: crypto.randomUUID(), name: 'Sheer Stubbornness', level: 5, description: 'Refuse to die through force of personality.', effortType: 'basic' },
    ],
    viewerCount: 1240,
    notes: 'Retired bingo hall manager from Wolverhampton. Has survived three recessions and two divorces. The dungeon is not her biggest problem.',
  },
  {
    crawlerName: 'FLEX',
    playerName: 'Player 2',
    hp: 12, maxHp: 12, mp: 0, maxMp: 0,
    stats: { STR: 7, DEX: 5, CON: 5, INT: 2, CHA: 4, WIS: 3 },
    skills: [
      { id: crypto.randomUUID(), name: 'Personal Training', level: 6, description: 'Motivate others. Mostly by shouting.', effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Protein Shake Consumption', level: 8, description: 'Somehow still relevant in the dungeon.', effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Unarmed Combat', level: 3, description: 'Technically trained. Not very effective.', effortType: 'weapon' },
    ],
    viewerCount: 980,
    notes: 'Personal trainer. Looks extremely dangerous. Statistically more likely to injure himself than an enemy. The audience finds this hilarious.',
  },
  {
    crawlerName: 'QUILL',
    playerName: 'Player 3',
    hp: 10, maxHp: 10, mp: 6, maxMp: 6,
    stats: { STR: 2, DEX: 4, CON: 3, INT: 7, CHA: 4, WIS: 6 },
    skills: [
      { id: crypto.randomUUID(), name: 'Monster Lore', level: 5, description: 'Knows exactly what will kill you. Cannot stop it.', effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Cataloguing', level: 6, description: 'Index anything. Somehow useful.', effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Minor Arcana', level: 2, description: 'Can light a candle. Working on fireballs.', effortType: 'magic' },
    ],
    viewerCount: 1450,
    notes: 'Librarian. Knows more about dungeon creatures than anyone alive. This has not helped her survive a single encounter. The viewers love her panic.',
  },
  {
    crawlerName: 'MILES',
    playerName: 'Player 4',
    hp: 12, maxHp: 12, mp: 2, maxMp: 2,
    stats: { STR: 4, DEX: 6, CON: 4, INT: 4, CHA: 3, WIS: 5 },
    skills: [
      { id: crypto.randomUUID(), name: 'Defensive Driving', level: 5, description: 'Applicable in more situations than expected.', effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Package Navigation', level: 7, description: 'Find exits. Always. Even here.', effortType: 'basic' },
      { id: crypto.randomUUID(), name: 'Staying Calm', level: 8, description: 'Unsettlingly calm in all situations.', effortType: 'basic' },
    ],
    viewerCount: 1100,
    notes: 'Delivery driver. Has been in worse situations (the M25 at 8am). Navigates the dungeon like it is a familiar route. This bothers everyone.',
  },
]

async function seed() {
  const existing = await db.select().from(characters)
  if (existing.length > 0) {
    console.log('[seed] Characters already seeded:', existing.map(c => c.crawlerName).join(', '))
    process.exit(0)
  }
  for (const c of crawlers) {
    await db.insert(characters).values({
      crawlerName: c.crawlerName, playerName: c.playerName,
      hp: c.hp, maxHp: c.maxHp, mp: c.mp, maxMp: c.maxMp,
      stats: c.stats, skills: c.skills,
      equipment: {}, inventory: [], achievements: [],
      viewerCount: c.viewerCount, sponsors: [], statusEffects: [],
      notes: c.notes, isAlive: true,
    })
    console.log('[seed] Created crawler:', c.crawlerName, '—', c.notes.split('.')[0])
  }
  console.log('[seed] Done. 4 crawlers ready for Floor 1.')
  process.exit(0)
}

seed().catch(err => { console.error('[seed] Error:', err); process.exit(1) })
