import { Hono } from 'hono'
import { db } from '../db/client.js'
import { mobTemplates } from '../db/schema.js'
import { eq, like, or, and } from 'drizzle-orm'

export const mobsRouter = new Hono()

// GET /api/mobs — list/search mob templates
mobsRouter.get('/', async (c) => {
  const q = c.req.query('q')
  const floor = c.req.query('floor')
  const elite = c.req.query('elite')
  const boss = c.req.query('boss')

  const filters = []
  if (q) filters.push(or(like(mobTemplates.name, `%${q}%`), like(mobTemplates.description, `%${q}%`)))
  if (floor) filters.push(eq(mobTemplates.floor, parseInt(floor)))
  if (elite === 'true') filters.push(eq(mobTemplates.isElite, true))
  if (boss === 'true') filters.push(eq(mobTemplates.isBoss, true))

  const results = filters.length > 0
    ? await db.select().from(mobTemplates).where(and(...filters))
    : await db.select().from(mobTemplates)

  return c.json(results)
})

// GET /api/mobs/:id
mobsRouter.get('/:id', async (c) => {
  const [mob] = await db.select().from(mobTemplates).where(eq(mobTemplates.id, c.req.param('id')))
  if (!mob) return c.json({ error: 'Not found' }, 404)
  return c.json(mob)
})
