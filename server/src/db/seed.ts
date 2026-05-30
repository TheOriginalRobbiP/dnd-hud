import { db } from './client.js'
import { floorState, items, mobTemplates } from './schema.js'
import { seedBopcaMobs } from './bopca-mobs-seed.js'
import { seedBopcaItems } from './bopca-items-seed.js'
import { seedItems } from './items-seed.js'
import { seedTier2Items } from './items-seed-tier2.js'
import { seedFloorPlans } from './floor-plan-seed.js'

async function seed() {
  console.log('[seed] Clearing items and mob templates databases to prevent stale/truncated entries...')
  await db.delete(items)
  await db.delete(mobTemplates)

  console.log('[seed] Initialising floor state...')
  await db.insert(floorState)
    .values({ id: 1 })
    .onConflictDoNothing()

  console.log('[seed] Importing Bopca mobs...')
  await seedBopcaMobs()

  console.log('[seed] Importing Bopca items...')
  await seedBopcaItems()

  console.log('[seed] Importing core items (rusty weapons, armor, starting potions)...')
  await seedItems()

  console.log('[seed] Importing tier-2 items (gold/platinum/legendary/celestial)...')
  await seedTier2Items()

  console.log('[seed] Importing pre-seeded Floor 1 map...')
  await seedFloorPlans()

  console.log('[seed] Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('[seed] Error:', err)
  process.exit(1)
})
