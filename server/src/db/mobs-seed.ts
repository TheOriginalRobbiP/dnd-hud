import { db } from './client.js'
import { mobTemplates } from './schema.js'
import * as dotenv from 'dotenv'
dotenv.config()

import { db } from './client.js'
import { mobTemplates } from './schema.js'
import * as dotenv from 'dotenv'
dotenv.config()

const MOBS = [

  // ════════════════════════════════════════
  // FLOOR 1 — THE COMMONS
  // ════════════════════════════════════════

  // Commons
  { name: 'Dungeon Goblin', description: 'Small, angry, and abundant. The commons is lousy with them. The audience finds them endearing until they actually hit someone.', hpMin: 4, hpMax: 8, effortType: 'basic', floor: 1, isElite: false, isBoss: false, abilities: 'Pack tactics — deals +1 damage per goblin adjacent to target', notes: 'Spawn in groups of 3-5. Kill the big one first — it gives orders.', tags: 'goblin,common' },
  { name: 'Goblin Scrapper', description: 'Bigger than a regular goblin. Has a weapon it found. Very proud of this weapon.', hpMin: 6, hpMax: 12, effortType: 'weapon', floor: 1, isElite: false, isBoss: false, abilities: 'Weapon strike — uses the weapon, obviously', notes: 'Usually leads goblin packs. Drops its weapon on death.', tags: 'goblin,common' },
  { name: 'Cave Rat (Giant)', description: 'The dungeon has rats. They are large. They are hungry. The audience rates them 6/10 for menace.', hpMin: 3, hpMax: 6, effortType: 'basic', floor: 1, isElite: false, isBoss: false, abilities: 'Bite — applies Bleed Debuff on hit', notes: 'Fast. Hit hard for their size. Target anyone who is already bleeding.', tags: 'beast,rat,common' },
  { name: 'Shambling Corpse', description: 'Someone who did not make it. Now contributing to the dungeon ecosystem in a different capacity. The audience approves of the narrative poetry.', hpMin: 8, hpMax: 14, effortType: 'basic', floor: 1, isElite: false, isBoss: false, abilities: 'Grab — grapples target on hit, requires STR check to escape', notes: 'Slow but relentless. Cannot be intimidated. Does not care about pain.', tags: 'undead,common' },
  { name: 'Dungeon Bat Swarm', description: 'Individually trivial. Collectively very annoying. The cameras love them.', hpMin: 6, hpMax: 10, effortType: 'basic', floor: 1, isElite: false, isBoss: false, abilities: 'Swarm — hits all characters in range simultaneously', notes: 'Area attack. AoE spells wreck them. Treat as one mob.', tags: 'beast,bat,swarm,common' },
  { name: 'Trap Goblin', description: 'Specialises in deploying small, inconvenient traps. Cowardly. Viewers love to hate this one.', hpMin: 4, hpMax: 7, effortType: 'basic', floor: 1, isElite: false, isBoss: false, abilities: 'Trip wire — sets trap before combat. First crawler to move triggers it (Knockback).', notes: 'Priority target. Kill before it sets another trap.', tags: 'goblin,common,trap' },
  { name: 'Dungeon Slime', description: 'A slow-moving blob of corrosive goo. No intelligence. No ambitions. Just hunger.', hpMin: 10, hpMax: 18, effortType: 'basic', floor: 1, isElite: false, isBoss: false, abilities: 'Corrode — destroys one equipped item on successful hit (GM chooses)', notes: 'Weapon and magic effort both work. Ignores Knockback. Never retreats.', tags: 'slime,common' },
  { name: 'Feral Dog', description: 'Someone had a pet. The dungeon ate the owner. The dog adapted faster than expected.', hpMin: 5, hpMax: 9, effortType: 'weapon', floor: 1, isElite: false, isBoss: false, abilities: 'Lunge — moves to target and attacks in one action', notes: 'Fast. Prioritises isolated crawlers. The audience feels conflicted about this one.', tags: 'beast,dog,common' },

  // Floor 1 Elites
  { name: 'Goblin Warchief', description: 'Commands goblin packs. Has a helmet. The helmet is the source of its authority.', hpMin: 20, hpMax: 30, effortType: 'weapon', floor: 1, isElite: true, isBoss: false, abilities: 'War cry — all goblins in range get +2 to attacks for 1 round. Shield bash — stuns target for 1 round.', notes: 'Kill the warchief and the pack panics. Do not ignore the pack while fighting the chief.', tags: 'goblin,elite' },
  { name: 'Giant Cave Spider', description: 'Large. Eight eyes. Drops from the ceiling. The audience reaction shot is always good.', hpMin: 18, hpMax: 28, effortType: 'weapon', floor: 1, isElite: true, isBoss: false, abilities: 'Web — applies Paralysis for 1 round. Poison bite — applies Poison Debuff.', notes: 'Hangs from ceiling — ranged attacks or magic to dislodge first. Web cooldown 2 rounds.', tags: 'beast,spider,elite' },
  { name: 'Armoured Shambler', description: 'A corpse wearing salvaged armor. More dangerous than the regular kind. Significantly harder to put down.', hpMin: 22, hpMax: 35, effortType: 'weapon', floor: 1, isElite: true, isBoss: false, abilities: 'Armour — first 3 damage per hit is ignored. Slam — Knockback on hit.', notes: 'Magic effort bypasses the armour. Worth the extra effort.', tags: 'undead,elite' },

  // Floor 1 Boss
  { name: 'The Commons Warden', description: 'An ancient dungeon construct assigned to maintain order in the commons. Has been doing this for 400 years. It is bored and angry.', hpMin: 60, hpMax: 80, effortType: 'weapon', floor: 1, isElite: false, isBoss: true, abilities: 'Dungeon authority — immune to fear and social skills. Enforce — attacks all crawlers simultaneously. Emergency protocol — at 25% HP, calls 2d4 dungeon goblins as reinforcements.', notes: 'Boss encounter. Clear the room of regular mobs first. The emergency protocol at 25% HP is the real danger — save AoE abilities for it.', tags: 'construct,boss,floor1' },

  // ════════════════════════════════════════
  // FLOOR 2 — THE DESPERADO COURT
  // ════════════════════════════════════════

  // Commons
  { name: 'Player Killer (Rookie)', description: 'A crawler who decided hunting other crawlers was more profitable than fighting mobs. Wrong decision. Still here though.', hpMin: 12, hpMax: 20, effortType: 'weapon', floor: 2, isElite: false, isBoss: false, abilities: 'Sucker punch — deals double damage if attacking from behind or surprise', notes: 'Uses crawlers as cover. Viewer counts spike when crawlers fight each other. Drops whatever it looted.', tags: 'crawler,pk,common' },
  { name: 'Desperado Gunslinger', description: 'Has a revolver. Six shots. Knows how to use it. The audience counts the bullets.', hpMin: 14, hpMax: 22, effortType: 'weapon', floor: 2, isElite: false, isBoss: false, abilities: 'Quick draw — attacks first in round regardless of initiative. Suppressing fire — forces target behind cover or take extra damage.', notes: 'Closes to medium range. Does not engage in melee. Retreats when out of ammo.', tags: 'human,ranged,common' },
  { name: 'Faction Enforcer', description: 'Works for one of the Desperado Court factions. Very loyal. Will not negotiate. Wears the armband.', hpMin: 16, hpMax: 24, effortType: 'weapon', floor: 2, isElite: false, isBoss: false, abilities: 'Intimidate — forces morale check on weakest crawler. Coordinated — deals extra damage when adjacent to another enforcer.', notes: 'Always in pairs. Killing one enrages the other (+2 damage). Check faction affiliation for RP opportunities.', tags: 'human,faction,common' },
  { name: 'Court Assassin', description: 'Hired to kill specific crawlers. Your group may or may not be the target. Hard to know until it attacks.', hpMin: 10, hpMax: 18, effortType: 'weapon', floor: 2, isElite: false, isBoss: false, abilities: 'Mark — designates one crawler as primary target (extra damage vs that target). Vanish — retreats to shadows, resets next attack to surprise.', notes: 'Will ignore everyone except the marked target. Marking changes if target dies. Never retreats.', tags: 'human,assassin,common' },
  { name: 'Mutant Sewer Crawler', description: 'Something that came up from the sewers beneath Floor 2. Adapted to dungeon life in ways that are not aesthetically pleasant.', hpMin: 14, hpMax: 20, effortType: 'basic', floor: 2, isElite: false, isBoss: false, abilities: 'Toxic spit — applies Poison and Queasy on hit. Regenerate — recovers 2 HP per round.', notes: 'Kill it fast before regen becomes an issue. Fire damage prevents regen for that round.', tags: 'mutant,beast,common' },

  // Floor 2 Elites
  { name: 'Player Killer (Veteran)', description: 'Has been hunting crawlers since Floor 1. Skilled. Equipped. Dangerous. Has killed things that came here thinking they were safe.', hpMin: 35, hpMax: 50, effortType: 'weapon', floor: 2, isElite: true, isBoss: false, abilities: 'Combat experience — immune to Stun and Knockback. Death mark — marked crawler takes +4 damage from all sources. Loot sense — knows what your best item is.', notes: 'Elite. Will target whoever has the most valuable loot. Viewers spike when it appears — the audience has been watching it hunt.', tags: 'crawler,pk,elite' },
  { name: 'Court Champion', description: 'The finest warrior the Desperado Court has produced. Tournament winner. Extremely good at violence. Has opinions about honour that complicate things.', hpMin: 40, hpMax: 55, effortType: 'weapon', floor: 2, isElite: true, isBoss: false, abilities: 'Challenge — forces one-on-one combat (other crawlers cannot interfere). Riposte — attacks attacker immediately after being hit. Honour code — will not attack downed opponents.', notes: 'Can be talked to. Will accept a duel instead of group combat. Honour code can be exploited (drop to 0 HP, it stops).', tags: 'human,champion,elite' },
  { name: 'Desperado Crime Boss', description: 'Controls a significant portion of Floor 2 economy. Has friends. Has debts. Has a problem with you specifically.', hpMin: 30, hpMax: 45, effortType: 'magic', floor: 2, isElite: true, isBoss: false, abilities: 'Bodyguards — 2 enforcers always present. Black market — can offer to buy/sell items mid-combat as a distraction. Connections — calls reinforcements on a 4+ each round.', notes: 'Kill bodyguards first. Reinforcement calls can be interrupted by targeting the Crime Boss directly. Worth keeping alive for RP — knows things.', tags: 'human,crime,elite' },

  // Floor 2 Boss
  { name: 'The Court Judge', description: 'The Desperado Court resolved its conflicts by appointing a Judge. The Judge is a 12-foot construct that dispenses dungeon justice with a gavel the size of a tree trunk.', hpMin: 90, hpMax: 120, effortType: 'weapon', floor: 2, isElite: false, isBoss: true, abilities: 'ORDER — silence all crawlers (no communication) for 1 round. Gavel strike — hits all crawlers in melee range. Judgment — picks one crawler and doubles all damage dealt to them this round. Recess — at 50% HP, fully heals and resets for one round (cannot be attacked).', notes: 'Boss encounter. The Recess at 50% is intentional — use it to heal. Judgment target should fall back. The ORDER ability prevents coordination — plan before combat.', tags: 'construct,boss,floor2' },

  // ════════════════════════════════════════
  // FLOOR 3 — THE TOADSTOOL GROTTO
  // ════════════════════════════════════════

  // Commons
  { name: 'Fungal Crawler', description: 'Humanoid shape. Made of toadstool. Moves wrong. The spores are the real danger.', hpMin: 16, hpMax: 24, effortType: 'basic', floor: 3, isElite: false, isBoss: false, abilities: 'Spore cloud — on death, releases spores. All adjacent crawlers make CON check or gain Queasy Debuff.', notes: 'Do not cluster near dying ones. Fire damage cauterises the spores — no cloud on kill.', tags: 'fungal,common' },
  { name: 'Mycelium Stalker', description: 'Thin. Fast. Hunts by tracking the electrical signals of wetware. It knows you are a crawler.', hpMin: 14, hpMax: 20, effortType: 'weapon', floor: 3, isElite: false, isBoss: false, abilities: 'Wetware sense — cannot be hidden from or surprised. Neurotoxin — Paralysis on hit, 1 round duration.', notes: 'Cannot be sneaked past. Paralysis is 1 round only but that is often enough. Kill fast.', tags: 'fungal,stalker,common' },
  { name: 'Toadstool Golem', description: 'A construct grown from the grotto floor. Slow. Dense. Basically a walking wall with opinions.', hpMin: 30, hpMax: 45, effortType: 'basic', floor: 3, isElite: false, isBoss: false, abilities: 'Fungal armour — first 4 damage per hit ignored. Toxic slam — Poison Debuff on hit. Rooted — cannot be moved by Knockback.', notes: 'Magic effort bypasses fungal armour. Split the party to draw its attention — it can only target one per round.', tags: 'fungal,golem,common' },
  { name: 'Spore Witch', description: 'A crawler who breathed too many spores on Floor 3 and became something else. Partially. She seems fine with it.', hpMin: 18, hpMax: 26, effortType: 'magic', floor: 3, isElite: false, isBoss: false, abilities: 'Mass spore — applies Queasy to all crawlers in range. Mycelium bond — roots one crawler in place for 1 round. Heal fungal — restores 8 HP to any fungal creature.', notes: 'Priority target — the heals make every fungal encounter much harder. She is technically a former crawler. Viewers find this distressing.', tags: 'fungal,human,magic,common' },

  // Floor 3 Elites
  { name: 'Elder Toadstool', description: 'Centuries old. The grotto grew around it. It is not happy about visitors.', hpMin: 55, hpMax: 75, effortType: 'magic', floor: 3, isElite: true, isBoss: false, abilities: 'Ancient spores — applies all three: Queasy, Poison, and Fatigued on hit. Mind fog — one crawler loses their action next round. Grotto bond — regains 5 HP per round while on the mushroom floor.', notes: 'Elite. Move the fight off the mushroom patches to disable the regen. Mind fog on the healer is its favourite play.', tags: 'fungal,ancient,elite' },
  { name: 'Mycelium Hive Mind', description: 'Many small fungal creatures acting as one. Individually harmless. Together, a serious problem.', hpMin: 45, hpMax: 60, effortType: 'basic', floor: 3, isElite: true, isBoss: false, abilities: 'Split — when reduced to 50% HP, splits into two weaker versions (30 HP each). Overwhelm — attacks all crawlers simultaneously when at full strength.', notes: 'AoE is mandatory here. Single-target damage is inefficient — it just splits. Fire or magic effort recommended.', tags: 'fungal,swarm,elite' },

  // Floor 3 Boss
  { name: 'The Grotto Sovereign', description: 'The dungeon AI assigned a management intelligence to Floor 3 and then forgot about it for two hundred years. It has had a lot of time to think. It has decided it does not like crawlers.', hpMin: 150, hpMax: 200, effortType: 'magic', floor: 3, isElite: false, isBoss: true, abilities: 'Grotto mastery — controls all fungal creatures on the floor as free actions. Spore apocalypse — once per fight, applies all debuffs to all crawlers (CON check halves). Mycelium throne — cannot be moved or knocked down. Class reveal — at 30% HP, the Sovereign strips class/race buffs for 2 rounds to see the "real" crawlers. Reward the worthy — on death, guaranteed Celestial box drops to the crawler who dealt the killing blow.', notes: 'FLOOR 3 BOSS. Class and Race unlock happens after this fight. The Class Reveal ability is the dramatic moment — play it up. Clearing this triggers the sponsor unlock announcement. Run the Spore Apocalypse early when crawlers are at full HP.', tags: 'fungal,boss,floor3,sovereign' },
]

async function seedMobs() {
  const existing = await db.select().from(mobTemplates)
  if (existing.length > 0) {
    console.log('[seed] Mobs already seeded:', existing.length, 'mob templates')
    process.exit(0)
  }

  for (const mob of MOBS) {
    await db.insert(mobTemplates).values(mob)
    console.log('[seed] Added mob:', mob.name)
  }
  console.log('[seed] Done.', MOBS.length, 'mob templates seeded.')
  process.exit(0)
}

seedMobs().catch(err => { console.error('[seed] Error:', err); process.exit(1) })
