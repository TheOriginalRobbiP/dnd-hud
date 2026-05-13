import { db } from './client.js'
import { items } from './schema.js'
import * as dotenv from 'dotenv'
dotenv.config()

async function clear() {
  await db.delete(items)
  console.log('[clear] Items table cleared')
  process.exit(0)
}
clear().catch(err => { console.error(err); process.exit(1) })
