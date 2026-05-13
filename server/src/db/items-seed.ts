import { db } from './client.js'
import { items } from './schema.js'
import * as dotenv from 'dotenv'
dotenv.config()

const ITEMS = [
  // ── FLOOR 1 COMMONS ──────────────────────────────────────────
  // Weapons
  { name: 'Rusty Shiv', description: 'A length of sharpened scrap. The dungeon provided this. That tells you something.', tier: 'common', lootBoxTier: 'bronze', slot: 'mainHand', effortType: 'weapon', skillBonus: null, floorFound: 1, tags: 'weapon' },
  { name: 'Plank with a Nail', description: 'Crude. Effective. The nail is rusty. There is a tetanus debuff risk but the System does not track that.', tier: 'common', lootBoxTier: 'bronze', slot: 'mainHand', effortType: 'weapon', skillBonus: null, floorFound: 1, tags: 'weapon' },
  { name: 'Broken Bottle', description: 'Jagged glass. Not ideal. Yours now.', tier: 'common', lootBoxTier: 'bronze', slot: 'mainHand', effortType: 'weapon', skillBonus: null, floorFound: 1, tags: 'weapon' },
  { name: 'Goblin Cleaver', description: 'Taken from a goblin. Still has goblin on it.', tier: 'common', lootBoxTier: 'bronze', slot: 'mainHand', effortType: 'weapon', skillBonus: '+1 to Unarmed Combat Skill', floorFound: 1, tags: 'weapon' },
  { name: 'Crossbow (Unloaded)', description: 'A crossbow. No bolts included. The System finds this hilarious.', tier: 'common', lootBoxTier: 'bronze', slot: 'mainHand', effortType: 'weapon', skillBonus: null, floorFound: 1, tags: 'weapon,ranged' },
  // Armor
  { name: 'Scavenged Helmet', description: 'Dented. Smells of its previous owner. Provides minor head protection.', tier: 'common', lootBoxTier: 'bronze', slot: 'head', effortType: null, skillBonus: null, floorFound: 1, tags: 'armor' },
  { name: 'Leather Vest', description: 'Cobbled together from dungeon rat hide. The rats resent this.', tier: 'common', lootBoxTier: 'bronze', slot: 'chest', effortType: null, skillBonus: null, floorFound: 1, tags: 'armor' },
  { name: 'Cloth Wrappings', description: 'Your arms are now slightly more protected. Marginally.', tier: 'common', lootBoxTier: 'bronze', slot: 'arms', effortType: null, skillBonus: null, floorFound: 1, tags: 'armor' },
  { name: 'Borrowed Boots', description: 'Someone left these behind. You choose not to wonder why.', tier: 'common', lootBoxTier: 'bronze', slot: 'feet', effortType: null, skillBonus: null, floorFound: 1, tags: 'armor' },
  { name: 'Fingerless Gloves', description: 'Improves grip. Reduces dignity. Net positive.', tier: 'common', lootBoxTier: 'bronze', slot: 'hands', effortType: null, skillBonus: '+1 to Climbing Skill', floorFound: 1, tags: 'armor' },
  // Jewelry / accessories
  { name: 'Brass Ring', description: 'A ring. It does nothing. The audience watches you put it on anyway.', tier: 'common', lootBoxTier: 'bronze', slot: 'fingers', effortType: null, skillBonus: null, floorFound: 1, tags: 'jewelry' },
  { name: 'Lucky Coin (on string)', description: 'Not actually lucky. But you believe it is, which is almost the same thing.', tier: 'common', lootBoxTier: 'bronze', slot: 'neck', effortType: null, skillBonus: null, floorFound: 1, tags: 'jewelry' },
  // Utility
  { name: 'Dungeon Map Fragment', description: 'A partial map of somewhere. Not here. Still useful, somehow.', tier: 'common', lootBoxTier: 'bronze', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: false, tags: 'utility' },
  { name: 'Healing Potion (Weak)', description: 'Restores 1d4 HP. Tastes of copper and despair. Use before cooldown expires.', tier: 'common', lootBoxTier: 'bronze', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,potion' },

  // ── FLOOR 1 UNCOMMONS ─────────────────────────────────────────
  { name: 'Serrated Combat Knife', description: 'Properly made. Someone cared about this once.', tier: 'uncommon', lootBoxTier: 'silver', slot: 'mainHand', effortType: 'weapon', skillBonus: '+2 to Unarmed Combat Skill', floorFound: 1, tags: 'weapon' },
  { name: 'Tower Shield Shard', description: 'A third of a tower shield. Still stops things.', tier: 'uncommon', lootBoxTier: 'silver', slot: 'offHand', effortType: null, skillBonus: null, floorFound: 1, tags: 'armor,shield' },
  { name: 'Patched Chainmail', description: 'Repaired so many times it is more patch than mail. The patches hold.', tier: 'uncommon', lootBoxTier: 'silver', slot: 'chest', effortType: null, skillBonus: null, floorFound: 1, tags: 'armor' },
  { name: 'Goblin-Tooth Necklace', description: 'Fashioned from your enemies. +1 to intimidating people who know what goblin teeth look like.', tier: 'uncommon', lootBoxTier: 'silver', slot: 'neck', effortType: null, skillBonus: '+1 to Intimidation Skill', floorFound: 1, tags: 'jewelry' },
  { name: 'Reinforced Knuckles', description: 'Brass knuckles with extra brass. The System approves of direct solutions.', tier: 'uncommon', lootBoxTier: 'silver', slot: 'hands', effortType: 'weapon', skillBonus: '+2 to Unarmed Combat Skill', floorFound: 1, tags: 'weapon,armor' },
  { name: 'Scrying Lens', description: 'A cracked lens that lets you see slightly further than normal. Marginally useful.', tier: 'uncommon', lootBoxTier: 'silver', slot: 'face', effortType: null, skillBonus: '+1 to Perception Skill', floorFound: 1, tags: 'utility' },
  { name: 'Vial of Troll Blood', description: 'Apply to wounds. Accelerates healing. Smells terrible. The audience holds their nose.', tier: 'uncommon', lootBoxTier: 'silver', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,potion' },
  { name: 'Ring of Mildly Improved Grip', description: 'Does exactly what it says. The craftsman had modest ambitions.', tier: 'uncommon', lootBoxTier: 'silver', slot: 'fingers', effortType: null, skillBonus: '+1 to Climbing Skill', floorFound: 1, tags: 'jewelry' },

  // ── FLOOR 2 UNCOMMONS ─────────────────────────────────────────
  { name: 'Desperado Revolver', description: 'A revolver. Six shots. The dungeon does not explain where the bullets come from.', tier: 'uncommon', lootBoxTier: 'silver', slot: 'mainHand', effortType: 'weapon', skillBonus: null, floorFound: 2, tags: 'weapon,ranged,firearm' },
  { name: 'Safe Room Keycard', description: 'Access to one safe room. Single use. Do not lose this.', tier: 'uncommon', lootBoxTier: 'silver', slot: null, effortType: null, skillBonus: null, floorFound: 2, isConsumable: true, tags: 'utility,key' },
  { name: 'Faction Armband', description: 'Marks you as belonging to someone. Keeps some people from killing you. Enrages others.', tier: 'uncommon', lootBoxTier: 'silver', slot: 'arms', effortType: null, skillBonus: null, floorFound: 2, tags: 'utility,social' },
  { name: 'Shiv of Player Killing', description: 'Enhanced for use against other crawlers. The System notes the irony.', tier: 'uncommon', lootBoxTier: 'gold', slot: 'mainHand', effortType: 'weapon', skillBonus: '+3 to Unarmed Combat Skill vs. crawlers', floorFound: 2, tags: 'weapon' },
  { name: 'Smoke Grenade', description: 'Creates a smoke cloud. Crawlers love smoke clouds. So does the audience.', tier: 'uncommon', lootBoxTier: 'silver', slot: null, effortType: null, skillBonus: null, floorFound: 2, isConsumable: true, tags: 'consumable,tactical' },

  // ── FLOOR 2-3 RARES ───────────────────────────────────────────
  { name: 'Enchanted Longsword', description: 'Glows faintly blue. Hits significantly harder than its appearance suggests.', tier: 'rare', lootBoxTier: 'gold', slot: 'mainHand', effortType: 'weapon', skillBonus: '+3 to all weapon attacks', floorFound: 2, tags: 'weapon,magic' },
  { name: 'Mage Robe of the Grotto', description: 'Woven from toadstool silk. Scratchy but magically potent.', tier: 'rare', lootBoxTier: 'gold', slot: 'chest', effortType: null, skillBonus: '+2 to all magic skills', floorFound: 3, tags: 'armor,magic' },
  { name: 'Boots of Uncanny Speed', description: 'You move faster. The System does not say how much faster. Faster.', tier: 'rare', lootBoxTier: 'gold', slot: 'feet', effortType: null, skillBonus: '+3 to Running Skill', floorFound: 2, tags: 'armor,magic' },
  { name: 'Amulet of the Viewing Public', description: 'Increases your viewer count passively. The audience loves a good accessory.', tier: 'rare', lootBoxTier: 'gold', slot: 'neck', effortType: null, skillBonus: null, floorFound: 2, tags: 'jewelry,fame' },
  { name: 'Helm of Clarity', description: 'Reduces confusion effects. Your thoughts are slightly less chaotic. Slightly.', tier: 'rare', lootBoxTier: 'gold', slot: 'head', effortType: null, skillBonus: '+2 to INT checks', floorFound: 2, tags: 'armor,magic' },
  { name: 'Gauntlets of the Brawler', description: 'Your fists are now weapons. They were before, but now the System agrees.', tier: 'rare', lootBoxTier: 'gold', slot: 'hands', effortType: 'weapon', skillBonus: '+4 to Unarmed Combat Skill', floorFound: 2, tags: 'armor,weapon,magic' },
  { name: 'Ring of the Dungeon Runner', description: 'Worn by crawlers who survive long enough to get to Floor 3. Most do not.', tier: 'rare', lootBoxTier: 'gold', slot: 'fingers', effortType: null, skillBonus: '+2 to CON, +2 to DEX', floorFound: 3, tags: 'jewelry,magic' },
  { name: 'Grotto Staff', description: 'Cut from a petrified toadstool. Channels magic particularly well.', tier: 'rare', lootBoxTier: 'gold', slot: 'mainHand', effortType: 'magic', skillBonus: '+3 to all magic skills', floorFound: 3, tags: 'weapon,magic' },
  { name: 'Blessed Shield', description: 'Someone prayed over this. The dungeon does not specify which deity responded.', tier: 'rare', lootBoxTier: 'gold', slot: 'offHand', effortType: null, skillBonus: null, floorFound: 2, tags: 'armor,shield,magic' },
  { name: 'Potion of Giant Strength', description: 'Temporarily grants immense STR. Temporarily.', tier: 'rare', lootBoxTier: 'gold', slot: null, effortType: null, skillBonus: '+6 to STR for 3 rounds', floorFound: 2, isConsumable: true, tags: 'consumable,potion' },
  { name: 'Tome of Basic Arcana', description: 'A real spellbook. Not particularly advanced. Better than nothing.', tier: 'rare', lootBoxTier: 'gold', slot: null, effortType: 'magic', skillBonus: '+2 to Minor Arcana Skill', floorFound: 3, tags: 'utility,magic,book' },
  { name: 'Golem Fist (Left)', description: 'A mechanical fist. Replaces yours. The right fist is somewhere else.', tier: 'rare', lootBoxTier: 'platinum', slot: 'hands', effortType: 'weapon', skillBonus: '+5 to Unarmed Combat Skill', floorFound: 2, tags: 'weapon,mechanical' },
  { name: 'Cloak of Crowd Pleasing', description: 'Makes everything you do look more impressive. The audience viewer counts reflect this.', tier: 'rare', lootBoxTier: 'gold', slot: 'chest', effortType: null, skillBonus: '+3 to CHA', floorFound: 2, tags: 'armor,social,fame' },

  // ── PLATINUM TIER ─────────────────────────────────────────────
  { name: 'Void Blade', description: 'A weapon that appears to eat light. The audience goes silent when you draw it.', tier: 'legendary', lootBoxTier: 'platinum', slot: 'mainHand', effortType: 'weapon', skillBonus: '+5 to all weapon attacks, ignores basic armor', floorFound: 3, tags: 'weapon,magic,rare' },
  { name: 'Armour of the Survivor', description: 'Worn by crawlers who have died once and come back. It remembers.', tier: 'legendary', lootBoxTier: 'platinum', slot: 'chest', effortType: null, skillBonus: '+4 to CON, DR 2 vs all damage', floorFound: 3, tags: 'armor,magic' },
  { name: 'Staff of the Watching Eye', description: 'The eye at the top watches your enemies. Occasionally it blinks. Nobody likes this.', tier: 'legendary', lootBoxTier: 'platinum', slot: 'mainHand', effortType: 'magic', skillBonus: '+5 to all magic skills, +2 INT', floorFound: 3, tags: 'weapon,magic' },
  { name: 'Boots of the Floor Breaker', description: 'You move as if the floor collapses behind you. It does not. Mostly.', tier: 'legendary', lootBoxTier: 'platinum', slot: 'feet', effortType: null, skillBonus: '+5 to DEX, immunity to floor collapse damage', floorFound: 3, tags: 'armor,magic' },
  { name: 'Crown of the Commons', description: 'Found on Floor 1. Someone important left this here. This is bad news.', tier: 'legendary', lootBoxTier: 'platinum', slot: 'head', effortType: null, skillBonus: '+5 to CHA, viewer count x2', floorFound: 1, tags: 'jewelry,magic,fame' },

  // ── LEGENDARY / CELESTIAL ─────────────────────────────────────
  { name: 'The Borant Corporation Credit Card', description: 'Unlimited credit at System shops. The interest rate is your soul. Terms and conditions apply.', tier: 'legendary', lootBoxTier: 'legendary', slot: null, effortType: null, skillBonus: null, floorFound: 3, tags: 'utility,legendary' },
  { name: 'Donut of Impossible Power', description: 'A pastry. Eating it grants +10 to all stats for one round. Then you are very full.', tier: 'legendary', lootBoxTier: 'legendary', slot: null, effortType: null, skillBonus: '+10 all stats for 1 round', floorFound: 3, isConsumable: true, tags: 'consumable,legendary,food' },
  { name: 'Ring of the Celestial Contract', description: 'You are now legally bound to something. The System will not say what. The audience watches the fine print.', tier: 'legendary', lootBoxTier: 'celestial', slot: 'fingers', effortType: null, skillBonus: null, floorFound: 3, tags: 'jewelry,legendary,celestial' },
  { name: 'The Last Bullet', description: 'One bullet. It hits anything. Anything. The System means anything.', tier: 'legendary', lootBoxTier: 'celestial', slot: null, effortType: 'weapon', skillBonus: null, floorFound: 3, isConsumable: true, tags: 'consumable,weapon,celestial' },
  { name: 'Wetware Upgrade: Neural Enhancer', description: 'Directly enhances your HUD. The System notes it probably should not have let you have this.', tier: 'legendary', lootBoxTier: 'celestial', slot: 'head', effortType: null, skillBonus: '+5 to INT, +3 to all skill caps', floorFound: 3, tags: 'magic,celestial,wetware' },

// ── BRONZE CONSUMABLES (most common drops) ────────────────────
  { name: 'Healing Potion', description: 'Restores 1d6 HP. Standard dungeon issue. The System provides the minimum.', tier: 'common', lootBoxTier: 'bronze', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,potion,healing' },
  { name: 'Antidote', description: 'Cures Poison Debuff. Tastes worse than the poison. Take it anyway.', tier: 'common', lootBoxTier: 'bronze', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,potion,cure' },
  { name: 'Stamina Draught', description: 'Removes Fatigued debuff. Not pleasant. Effective.', tier: 'common', lootBoxTier: 'bronze', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,potion' },
  { name: 'Mana Crystal (Cracked)', description: 'Restores 1 MP. Cracked during delivery. The System regrets nothing.', tier: 'common', lootBoxTier: 'bronze', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,magic' },
  { name: 'Flash Scroll', description: 'Single-use scroll. Creates a blinding flash. Basic. Useful.', tier: 'common', lootBoxTier: 'bronze', slot: null, effortType: 'magic', skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,scroll,magic' },
  { name: 'Dungeon Ration', description: 'Edible. Technically. Removes Queasy debuff. The audience films you eating it.', tier: 'common', lootBoxTier: 'bronze', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,food' },
  { name: 'Bandage Roll', description: 'Stops bleeding. Does not restore HP. Stops the bleeding. That is enough.', tier: 'common', lootBoxTier: 'bronze', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,medical' },
  { name: 'Smoke Pellet', description: 'Creates a small smoke cloud for 2 rounds. Useful. Popular. The audience expects it.', tier: 'common', lootBoxTier: 'bronze', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,tactical' },

  // ── SILVER CONSUMABLES ────────────────────────────────────────
  { name: 'Greater Healing Potion', description: 'Restores 2d6 HP. Actually tastes acceptable. The System is in a good mood.', tier: 'uncommon', lootBoxTier: 'silver', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,potion,healing' },
  { name: 'Skill Potion (Minor)', description: 'Grants +2 to one chosen skill for 3 rounds. Choose wisely. The audience is watching.', tier: 'uncommon', lootBoxTier: 'silver', slot: null, effortType: null, skillBonus: '+2 to chosen skill (3 rounds)', floorFound: 1, isConsumable: true, tags: 'consumable,potion' },
  { name: 'Scroll of Arcane Bolt', description: 'Single-use. Fires a bolt of force. No skill required to activate. Useful for the magically challenged.', tier: 'uncommon', lootBoxTier: 'silver', slot: null, effortType: 'magic', skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,scroll,magic' },
  { name: 'Invisibility Vial', description: 'One minute of invisibility. The audience switches to thermal cameras. Still counts.', tier: 'uncommon', lootBoxTier: 'silver', slot: null, effortType: null, skillBonus: null, floorFound: 2, isConsumable: true, tags: 'consumable,potion,stealth' },
  { name: 'Strength Draught', description: 'STR +4 for 2 rounds. Your muscles hurt afterwards. Worth it.', tier: 'uncommon', lootBoxTier: 'silver', slot: null, effortType: null, skillBonus: '+4 STR for 2 rounds', floorFound: 1, isConsumable: true, tags: 'consumable,potion' },
  { name: 'Mana Potion', description: 'Restores 3 MP instantly. Popular with the magic-using demographic of the audience.', tier: 'uncommon', lootBoxTier: 'silver', slot: null, effortType: null, skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,potion,magic' },
  { name: 'Flashbang Grenade', description: 'Stuns all targets in range for 1 round. Including allies. Read the room.', tier: 'uncommon', lootBoxTier: 'silver', slot: null, effortType: null, skillBonus: null, floorFound: 2, isConsumable: true, tags: 'consumable,tactical' },
  { name: 'Scroll of Lesser Healing', description: 'Heals 1d8 HP to one target. Can be used on others. Novel concept.', tier: 'uncommon', lootBoxTier: 'silver', slot: null, effortType: 'magic', skillBonus: null, floorFound: 1, isConsumable: true, tags: 'consumable,scroll,magic,healing' },

  // ── GOLD CONSUMABLES ─────────────────────────────────────────
  { name: 'Legendary Skill Potion', description: 'Permanently increases one skill by 1 level. The System rarely gives these. Someone made a mistake.', tier: 'rare', lootBoxTier: 'gold', slot: null, effortType: null, skillBonus: '+1 permanent skill level', floorFound: 2, isConsumable: true, tags: 'consumable,potion,permanent' },
  { name: 'Scroll of Fireball', description: 'The classic. Does what it says. The audience counts casualties.', tier: 'rare', lootBoxTier: 'gold', slot: null, effortType: 'magic', skillBonus: null, floorFound: 2, isConsumable: true, tags: 'consumable,scroll,magic' },
  { name: 'Resurrection Seed', description: 'If swallowed before death, auto-revives at 1 HP. The System is unhappy you have this.', tier: 'rare', lootBoxTier: 'gold', slot: null, effortType: null, skillBonus: 'Auto-revive at 1 HP (single use)', floorFound: 3, isConsumable: true, tags: 'consumable,legendary,revival' },
  { name: 'Stat Shard (CON)', description: 'Permanently increases CON by 1. The System charges extra for these. Someone miscounted inventory.', tier: 'rare', lootBoxTier: 'gold', slot: null, effortType: null, skillBonus: '+1 permanent CON', floorFound: 3, isConsumable: true, tags: 'consumable,permanent,stat' },

  // ── NIPPLES / TOES (because canon) ────────────────────────────
  { name: 'Nipple Rings of Minor Fortitude', description: 'The dungeon is a strange place. These exist. They provide CON +1. You equip them anyway.', tier: 'uncommon', lootBoxTier: 'silver', slot: 'nipples', effortType: null, skillBonus: '+1 to CON', floorFound: 1, tags: 'jewelry' },
  { name: 'Toe Ring of Surprising Agility', description: 'One ring. One toe. The audience did not expect this to be a thing.', tier: 'uncommon', lootBoxTier: 'silver', slot: 'toes', effortType: null, skillBonus: '+1 to DEX', floorFound: 1, tags: 'jewelry' },
  { name: 'Enchanted Nipple Plate', description: 'Surprisingly protective. The craftsman had a vision. Nobody questions the vision.', tier: 'rare', lootBoxTier: 'gold', slot: 'nipples', effortType: null, skillBonus: '+2 to CON, DR 1', floorFound: 2, tags: 'armor,magic' },
  { name: 'Toe Spikes of the Desperate', description: 'Sharpened spikes on your toes. You can kick. Hard. The audience winces.', tier: 'rare', lootBoxTier: 'gold', slot: 'toes', effortType: 'weapon', skillBonus: '+3 to Unarmed Combat Skill (kicks only)', floorFound: 2, tags: 'weapon,armor' },
]

async function seedItems() {
  const existing = await db.select().from(items)
  if (existing.length > 0) {
    console.log('[seed] Items already seeded:', existing.length, 'items')
    process.exit(0)
  }

  for (const item of ITEMS) {
    await db.insert(items).values({
      name: item.name,
      description: item.description,
      tier: item.tier,
      lootBoxTier: item.lootBoxTier ?? null,
      slot: item.slot ?? null,
      effortType: item.effortType ?? null,
      skillBonus: item.skillBonus ?? null,
      floorFound: item.floorFound ?? 1,
      isConsumable: item.isConsumable ?? false,
      tags: item.tags ?? '',
    })
    console.log('[seed] Added item:', item.name)
  }
  console.log('[seed] Done.', ITEMS.length, 'items seeded.')
  process.exit(0)
}

seedItems().catch(err => { console.error('[seed] Error:', err); process.exit(1) })
