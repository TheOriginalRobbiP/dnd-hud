// ── Character Creation Data ───────────────────────────────────
// Sourced from DCC RPG Crawlers Preview PDF

export const STAT_ARRAY = [2, 3, 4, 5, 6] // standard array — assign one to each stat

export const COMBAT_SKILLS = [
  // Bashing
  { name: 'Cast-Iron Skillet (Club)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Bashing', description: 'Melee. Heavy, seasoned iron found in the kitchen. Bludgeoning.' },
  { name: 'Heavy Sledgehammer (Warhammer)', effortType: 'weapon' as const, damage: '1d10 + STR', type: 'Bashing', description: 'Melee. Heavy demolition tool from the garage. Requires two hands. Bludgeoning.' },
  { name: 'Improvised Weapons', effortType: 'weapon' as const, damage: '1d4 + STR', type: 'Bashing', description: 'Melee. Pick up any random 1-STR lb object (ash tray, brick, heavy book) and smash.' },
  // Edged
  { name: 'Rusty Camping Axe (Axe)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Edged', description: 'Melee. Slashing utility hatchet scrounged from the shed.' },
  { name: 'Kitchen Chef Knife (Dagger)', effortType: 'weapon' as const, damage: '1d4 + STR', type: 'Edged', description: 'Melee. Dex to hit. Piercing blade grabbed during a 10-second kitchen raid. AI Favor: 1.' },
  { name: 'Clearing Machete (Longsword)', effortType: 'weapon' as const, damage: '1d8 + STR', type: 'Edged', description: 'Melee. Long, brutal brush-clearing blade from the garden shed. Slashing.' },
  // Ranged
  { name: 'Old Hunting Bow (Bow)', effortType: 'weapon' as const, damage: '1d6 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Piercing. Compound bow grabbed from the closet.' },
  { name: 'Compact Handgun (Handgun)', effortType: 'weapon' as const, damage: '1d8 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Piercing. Home defense pistol grabbed from the nightstand drawer.' },
  { name: 'Double-Barrel Shotgun (Shotgun)', effortType: 'weapon' as const, damage: '1d10 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Piercing. Heavy gauge, requires two hands.' },
  { name: 'Steel-Ball Slingshot (Slingshot)', effortType: 'weapon' as const, damage: '1d4 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Quiet bludgeoning. Grabbed from a kid\'s toy box. AI Favor: 1.' },
  { name: 'Steel-Tip Dart (Javelin)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Ranged', description: 'Thrown. Str to hit. Piercing dart found in the man-cave.' },
  { name: 'Metal Throwing Shuriken', effortType: 'weapon' as const, damage: '1d4 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Slashing. Decorative ninja stars found in the attic. AI Favor: 1.' },
  { name: 'Hunting Crossbow (Crossbow)', effortType: 'weapon' as const, damage: '1d8 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Piercing. Heavy target crossbow found in the attic.' },
  // Reach
  { name: 'Garden Pitchfork (Polearm)', effortType: 'weapon' as const, damage: '1d8 + STR', type: 'Reach', description: 'Reach (10ft). Requires two hands. Piercing garden tool.' },
  { name: 'Stout Broom Handle (Quarterstaff)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Reach', description: 'Reach (10ft). Bludgeoning. Hardwood broom handle unscrewed from the brush head.' },
  // Hand-to-Hand
  { name: 'Pugilism (Taped Fists)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Hand-to-Hand', description: 'Unarmed. DEX to hit. Taped knuckles and pure adrenaline. Choose Damage Effect: Iron Punch or Powerful Strike.' },
  { name: 'Steel-Toe Boots (Foot Soldier)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Hand-to-Hand', description: 'Unarmed. DEX to hit. Stomping with heavy work boots. Damage Effect: Smush.' },
  { name: 'Hard Helmet (Noggin Nocker)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Hand-to-Hand', description: 'Unarmed. DEX to hit. Headbutting with a heavy construction/bike helmet. Damage Effect: Skullcracker.' },
  // Animal
  { name: 'Slice Attack (Claws)', effortType: 'weapon' as const, damage: '1d4 + STR', type: 'Animal', description: 'Melee. Slashing paws. AI Favor: 1. (Animal/Pet crawlers only)' },
  { name: 'Back Claw (Kick)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Animal', description: 'Melee. Slashing kick. (Animal/Pet crawlers only)' },
  { name: 'Rabid Bite (Bite)', effortType: 'weapon' as const, damage: '1d8 + STR', type: 'Animal', description: 'Melee. Piercing jaws. Requires graspable appendage. (Animal/Pet crawlers only)' },
  // Spells (requires INT 4+)
  { name: 'Fling Dirt (Dirt Clod)', effortType: 'magic' as const, damage: '1d4 + INT', type: 'Spell', description: 'Ranged. INT to hit. Bludgeoning. Grab a handful of garden soil and focus. Mana: 2.' },
  { name: 'Lighter & Aerosol (Fire Fingers)', effortType: 'magic' as const, damage: '1d6 + INT', type: 'Spell', description: 'Ranged. INT to hit. Fire. Cheap aerosol can and lighter ignited with psychic force. Mana: 4.' },
  { name: 'Upgraded Cattle Prod (Shock Treatment)', effortType: 'magic' as const, damage: '1d8 + INT', type: 'Spell', description: 'Ranged. INT to hit. Lightning. Modified high-voltage cattle prod sparked with mana. Mana: 6.' },
  { name: 'Freon Spray Can (Frost Scar)', effortType: 'magic' as const, damage: '1d6 + INT', type: 'Spell', description: 'Ranged. INT to hit. Cold. Upside-down duster can sap-cooling targets. Applies Frosted debuff. Mana: 4.' },
  { name: 'Creepy Occult Relic (Soul Collector)', effortType: 'magic' as const, damage: '1d6 + INT', type: 'Spell', description: 'Ranged. INT to hit. Necrotic. Weird taxidermy/bone relic found in the attic. Mana: 5.' },
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
