import { db } from './client.js'
import { sql } from 'drizzle-orm'

async function run() {
  console.log('[cleanup] Dropping conflicting floor_state table to allow primary key type change from integer to uuid...')
  try {
    // This drops floor_state cascade so drizzle-kit can recreate it cleanly with UUID primary key
    await db.execute(sql`DROP TABLE IF EXISTS floor_state CASCADE;`)
    console.log('[cleanup] Table dropped successfully.')
  } catch (err) {
    console.error('[cleanup] Failed to drop table (might not exist yet):', err)
  }
  process.exit(0)
}

run().catch((err) => {
  console.error('[cleanup] Fatal:', err)
  process.exit(0)
})
