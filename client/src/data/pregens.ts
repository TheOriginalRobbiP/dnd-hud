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
