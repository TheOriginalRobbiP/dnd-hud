// ── Character Creation Data ───────────────────────────────────
// Sourced from DCC RPG Crawlers Preview PDF

export const STAT_ARRAY = [2, 3, 4, 5, 6] // standard array — assign one to each stat

export const COMBAT_SKILLS = [
  // Bashing
  { name: 'Club', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Bashing', description: 'Melee. Bludgeoning damage.' },
  { name: 'Warhammer', effortType: 'weapon' as const, damage: '1d10 + STR', type: 'Bashing', description: 'Melee. Requires two hands. Bludgeoning damage.' },
  { name: 'Improvised Weapons', effortType: 'weapon' as const, damage: '1d4 + STR', type: 'Bashing', description: 'Pick up anything 1–STR lbs and smack someone. Bludgeoning.' },
  // Edged
  { name: 'Axe', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Edged', description: 'Melee. Slashing damage.' },
  { name: 'Dagger', effortType: 'weapon' as const, damage: '1d4 + STR', type: 'Edged', description: 'Melee. DEX to hit. Piercing. AI Favor: 1.' },
  { name: 'Longsword', effortType: 'weapon' as const, damage: '1d8 + STR', type: 'Edged', description: 'Melee. Slashing damage.' },
  // Ranged
  { name: 'Crossbow', effortType: 'weapon' as const, damage: '1d8 + DEX', type: 'Ranged', description: 'Ranged. DEX to hit. Piercing damage.' },
  { name: 'Handgun', effortType: 'weapon' as const, damage: '1d8 + DEX', type: 'Ranged', description: 'Ranged. DEX to hit. Piercing damage.' },
  { name: 'Shotgun', effortType: 'weapon' as const, damage: '1d10 + DEX', type: 'Ranged', description: 'Ranged. DEX to hit. Piercing. Requires two hands.' },
  { name: 'Bow', effortType: 'weapon' as const, damage: '1d6 + DEX', type: 'Ranged', description: 'Ranged. DEX to hit. Piercing damage.' },
  { name: 'Javelin', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Ranged', description: 'Thrown. STR to hit. Piercing damage.' },
  { name: 'Slingshot', effortType: 'weapon' as const, damage: '1d4 + DEX', type: 'Ranged', description: 'Ranged. DEX to hit. Bludgeoning. AI Favor: 1.' },
  { name: 'Shuriken', effortType: 'weapon' as const, damage: '1d4 + DEX', type: 'Ranged', description: 'Ranged. DEX to hit. Slashing. AI Favor: 1.' },
  // Reach
  { name: 'Polearm', effortType: 'weapon' as const, damage: '1d8 + STR', type: 'Reach', description: 'Reach (10ft). Requires two hands. Slashing/Piercing.' },
  { name: 'Quarterstaff', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Reach', description: 'Reach (10ft). Bludgeoning damage.' },
  // Hand-to-Hand
  { name: 'Pugilism', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Hand-to-Hand', description: 'Unarmed. DEX to hit. Choose Damage Effect: Iron Punch or Powerful Strike.' },
  { name: 'Foot Soldier', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Hand-to-Hand', description: 'Unarmed. DEX to hit. Damage Effect: Smush.' },
  { name: 'Noggin Nocker', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Hand-to-Hand', description: 'Unarmed. DEX to hit. Damage Effect: Skullcracker.' },
  // Animal
  { name: 'Slice Attack', effortType: 'weapon' as const, damage: '1d4 + STR', type: 'Animal', description: 'Melee. Slashing. AI Favor: 1. (Animal crawlers only)' },
  { name: 'Back Claw', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Animal', description: 'Melee. Slashing. (Animal crawlers only)' },
  { name: 'Bite', effortType: 'weapon' as const, damage: '1d8 + STR', type: 'Animal', description: 'Melee. Piercing. Target must have a graspable appendage. (Animal crawlers only)' },
  // Spells (requires INT 4+)
  { name: 'Dirt Clod', effortType: 'magic' as const, damage: '1d4 + INT', type: 'Spell', description: 'Ranged. INT to hit. Bludgeoning. Mana cost: 2. Requires INT 4+.' },
  { name: 'Fire Fingers', effortType: 'magic' as const, damage: '1d6 + INT', type: 'Spell', description: 'Ranged. INT to hit. Fire damage. Mana cost: 4. Requires INT 4+.' },
  { name: 'Frost Scar', effortType: 'magic' as const, damage: '1d6 + INT', type: 'Spell', description: 'Ranged. INT to hit. Cold damage. Applies Frosted debuff. Mana cost: 4. Requires INT 4+.' },
  { name: 'Shock Treatment', effortType: 'magic' as const, damage: '1d8 + INT', type: 'Spell', description: 'Ranged. INT to hit. Lightning damage. Mana cost: 6. Requires INT 4+.' },
  { name: 'Soul Collector', effortType: 'magic' as const, damage: '1d6 + INT', type: 'Spell', description: 'Ranged. INT to hit. Necrotic damage. Mana cost: 5. Requires INT 4+.' },
]

// Background skill tables from the PDF
export const YOUTH_BACKGROUNDS = [
  { roll: 1, name: 'Privileged', skills: ['Deception', 'Good First Impression', 'Persuasion'] },
  { roll: 2, name: 'Working Class', skills: ['Endurance', 'Improvised Weapons', 'Streetwise'] },
  { roll: 3, name: 'Academic', skills: ['Investigation', 'Perception', 'Research'] },
  { roll: 4, name: 'Athletic', skills: ['Climbing', 'Endurance', 'Swimming'] },
  { roll: 5, name: 'Street Kid', skills: ['Deception', 'Hide in Shadows', 'Streetwise'] },
  { roll: 6, name: 'Rural', skills: ['Animal Handling', 'Survival', 'Tracking'] },
]

export const TRAINING_BACKGROUNDS = [
  { roll: 1, name: 'Trades', skills: ['Fabricate', 'Explosives Handling', 'First Aid'] },
  { roll: 2, name: 'Arts & Media', skills: ['Deception', 'Good First Impression', 'Performance'] },
  { roll: 3, name: 'Sciences', skills: ['Find Crawler', 'Investigation', 'Research'] },
  { roll: 4, name: 'Service', skills: ['Endurance', 'First Aid', 'Persuasion'] },
  { roll: 5, name: 'Criminal', skills: ['Escape Artist', 'Hide in Shadows', 'Sleight of Hand'] },
  { roll: 6, name: 'Military', skills: ['Endurance', 'Explosives Handling', 'Tactics'] },
]

export const ADULT_BACKGROUNDS = [
  { roll: 1, name: 'Labourer', skills: ['Climbing', 'Endurance', 'Improvised Weapons'] },
  { roll: 2, name: 'Professional', skills: ['Detect Lies', 'Good First Impression', 'Negotiation'] },
  { roll: 3, name: 'Technical', skills: ['Explosives Handling', 'Fabricate', 'Investigation'] },
  { roll: 4, name: 'Creative', skills: ['Deception', 'Performance', 'Persuasion'] },
  { roll: 5, name: 'Caregiver', skills: ['Animal Handling', 'First Aid', 'Persuasion'] },
  { roll: 6, name: 'Survivalist', skills: ['Hide in Shadows', 'Survival', 'Tracking'] },
]

export const QUIRK_BACKGROUNDS = [
  { roll: 1, name: 'Paranoid', skills: ['Detect Lies', 'Hide in Shadows', 'Perception'] },
  { roll: 2, name: 'Reckless', skills: ['Endurance', 'Improvised Weapons', 'Intimidate'] },
  { roll: 3, name: 'Scholarly', skills: ['Investigation', 'Research', 'Tactics'] },
  { roll: 4, name: 'Charming', skills: ['Deception', 'Good First Impression', 'Negotiation'] },
  { roll: 5, name: 'Resourceful', skills: ['Escape Artist', 'Fabricate', 'Sleight of Hand'] },
  { roll: 6, name: 'Spiritual', skills: ['Animal Handling', 'Endurance', 'Perception'] },
]

// Derived stat calculations
export function calcEvade(dex: number, floor = 1): number {
  return 10 + statMod(dex) + floor
}

export function calcMaxHp(con: number): number {
  // Base 10 + CON modifier × 2
  return 10 + statMod(con) * 2
}

export function calcMaxMp(int_: number): number {
  return int_ // MP = INT score
}

export function statMod(score: number): number {
  return score - 4
}

export function calcMove(dex: number): number {
  return 20 + statMod(dex) * 5
}
