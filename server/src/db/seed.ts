import { db } from './client.js'
import { floorState } from './schema.js'
import { seedBopcaMobs } from './bopca-mobs-seed.js'
import { seedBopcaItems } from './bopca-items-seed.js'

async function seed() {
  console.log('[seed] Initialising floor state...')
  await db.insert(floorState)
    .values({ id: 1 })
    .onConflictDoNothing()

  console.log('[seed] Importing Bopca mobs...')
  await seedBopcaMobs()

  console.log('[seed] Importing Bopca items...')
  await seedBopcaItems()

  console.log('[seed] Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('[seed] Error:', err)
  process.exit(1)
})
