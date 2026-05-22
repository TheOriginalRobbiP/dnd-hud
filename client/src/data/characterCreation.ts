// ── Character Creation Data ───────────────────────────────────
// Sourced from DCC RPG Crawlers Preview PDF

export const STAT_ARRAY = [2, 3, 4, 5, 6] // standard array — assign one to each stat

export const COMBAT_SKILLS = [
  // Bashing
  { name: 'Cast-Iron Skillet (Club)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Bashing', description: 'Melee. Heavy, seasoned iron skillet pulled from the rubble of a collapsed diner. Bludgeoning.' },
  { name: 'Heavy Sledgehammer (Warhammer)', effortType: 'weapon' as const, damage: '1d10 + STR', type: 'Bashing', description: 'Melee. Heavy-duty demolition hammer recovered from a flattened hardware store. Requires two hands. Bludgeoning.' },
  { name: 'Improvised Weapons', effortType: 'weapon' as const, damage: '1d4 + STR', type: 'Bashing', description: 'Melee. Grab a random chunk of masonry, a heavy pipe, or a shattered brick from the flat rubble and smash. Bludgeoning.' },
  // Edged
  { name: 'Rusty Camping Axe (Axe)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Edged', description: 'Melee. Slashing utility hatchet dug out of a flattened garden shed.' },
  { name: 'Kitchen Chef Knife (Dagger)', effortType: 'weapon' as const, damage: '1d4 + STR', type: 'Edged', description: 'Melee. Dex to hit. Piercing blade salvaged from a collapsed restaurant kitchen. AI Favor: 1.' },
  { name: 'Clearing Machete (Longsword)', effortType: 'weapon' as const, damage: '1d8 + STR', type: 'Edged', description: 'Melee. Long, brutal brush-clearing blade recovered from the ruins of a landscaping truck. Slashing.' },
  // Ranged
  { name: 'Old Hunting Bow (Bow)', effortType: 'weapon' as const, damage: '1d6 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Piercing. Compound hunting bow salvaged from a flattened sporting goods shop.' },
  { name: 'Pneumatic Staple Gun (Handgun)', effortType: 'weapon' as const, damage: '1d8 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Piercing. Heavy-duty construction stapler scrounged from a flattened contractor\'s work truck.' },
  { name: 'Framing Nail Gun (Shotgun)', effortType: 'weapon' as const, damage: '1d10 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Piercing. Heavy-gauge framing nailer dug out of a collapsed construction trailer. Requires two hands to brace and fire.' },
  { name: 'Steel-Ball Slingshot (Slingshot)', effortType: 'weapon' as const, damage: '1d4 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Quiet bludgeoning. Pocket slingshot salvaged from the collapsed ruins of a toy store. AI Favor: 1.' },
  { name: 'Steel-Tip Dart (Javelin)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Ranged', description: 'Thrown. Str to hit. Piercing bar darts pulled from the flattened rubble of a pub.' },
  { name: 'Metal Throwing Shuriken', effortType: 'weapon' as const, damage: '1d4 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Slashing. Decorative metal stars recovered from a flattened novelty shop. AI Favor: 1.' },
  { name: 'Hunting Crossbow (Crossbow)', effortType: 'weapon' as const, damage: '1d8 + DEX', type: 'Ranged', description: 'Ranged. Dex to hit. Piercing. Target crossbow recovered from the wreckage of a pawn shop.' },
  // Reach
  { name: 'Garden Pitchfork (Polearm)', effortType: 'weapon' as const, damage: '1d8 + STR', type: 'Reach', description: 'Reach (10ft). Requires two hands. Piercing fork salvaged from a flattened plant nursery.' },
  { name: 'Stout Broom Handle (Quarterstaff)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Reach', description: 'Reach (10ft). Bludgeoning. Hardwood broom handle snapped out of the rubble of a supply closet.' },
  // Hand-to-Hand
  { name: 'Pugilism (Taped Fists)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Hand-to-Hand', description: 'Unarmed. DEX to hit. Knuckles wrapped in industrial duct tape found in the debris. Choose Damage Effect: Iron Punch or Powerful Strike.' },
  { name: 'Steel-Toe Boots (Foot Soldier)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Hand-to-Hand', description: 'Unarmed. DEX to hit. Stomping with heavy steel-toe work boots dug from the rubble. Damage Effect: Smush.' },
  { name: 'Hard Helmet (Noggin Nocker)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Hand-to-Hand', description: 'Unarmed. DEX to hit. Headbutting with a heavy construction hardhat recovered from a collapsed building site. Damage Effect: Skullcracker.' },
  // Animal
  { name: 'Slice Attack (Claws)', effortType: 'weapon' as const, damage: '1d4 + STR', type: 'Animal', description: 'Melee. Slashing paws. AI Favor: 1. (Animal/Pet crawlers only)' },
  { name: 'Back Claw (Kick)', effortType: 'weapon' as const, damage: '1d6 + STR', type: 'Animal', description: 'Melee. Slashing kick. (Animal/Pet crawlers only)' },
  { name: 'Rabid Bite (Bite)', effortType: 'weapon' as const, damage: '1d8 + STR', type: 'Animal', description: 'Melee. Piercing jaws. Requires graspable appendage. (Animal/Pet crawlers only)' },
  // Spells (requires INT 4+)
  { name: 'Fling Dirt (Dirt Clod)', effortType: 'magic' as const, damage: '1d4 + INT', type: 'Spell', description: 'Ranged. INT to hit. Bludgeoning. Grab a handful of crushed concrete soil from the ruins and focus. Mana: 2.' },
  { name: 'Lighter & Aerosol (Fire Fingers)', effortType: 'magic' as const, damage: '1d6 + INT', type: 'Spell', description: 'Ranged. INT to hit. Fire. Cheap aerosol can and lighter recovered from a flattened drugstore, ignited with psychic mana force. Mana: 4.' },
  { name: 'Upgraded Cattle Prod (Shock Treatment)', effortType: 'magic' as const, damage: '1d8 + INT', type: 'Spell', description: 'Ranged. INT to hit. Lightning. Modified cattle prod recovered from a collapsed veterinary clinic, sparked with mana. Mana: 6.' },
  { name: 'Freon Spray Can (Frost Scar)', effortType: 'magic' as const, damage: '1d6 + INT', type: 'Spell', description: 'Ranged. INT to hit. Cold. Upside-down air duster scrounged from office rubble. Applies Frosted debuff. Mana: 4.' },
  { name: 'Creepy Occult Relic (Soul Collector)', effortType: 'magic' as const, damage: '1d6 + INT', type: 'Spell', description: 'Ranged. INT to hit. Necrotic. Weird antique skull relic dug out of a flattened museum display. Mana: 5.' },
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
