import { Hono } from 'hono'
import { db } from '../db/client.js'
import { items } from '../db/schema.js'
import { eq, like, or, and } from 'drizzle-orm'

export const itemsRouter = new Hono()

// GET /api/items — list/search items
itemsRouter.get('/', async (c) => {
  const q = c.req.query('q')
  const tier = c.req.query('tier')
  const slot = c.req.query('slot')
  const floor = c.req.query('floor')

  let query = db.select().from(items).$dynamic()

  const filters = []
  if (q) filters.push(or(like(items.name, `%${q}%`), like(items.description, `%${q}%`)))
  if (tier) filters.push(eq(items.tier, tier))
  if (slot) filters.push(eq(items.slot, slot))
  if (floor) filters.push(eq(items.floorFound, parseInt(floor)))

  if (filters.length > 0) {
    const results = await db.select().from(items).where(and(...filters))
    return c.json(results)
  }

  const results = await db.select().from(items)
  return c.json(results)
})

// GET /api/items/:id
itemsRouter.get('/:id', async (c) => {
  const [item] = await db.select().from(items).where(eq(items.id, c.req.param('id')))
  if (!item) return c.json({ error: 'Not found' }, 404)
  return c.json(item)
})
