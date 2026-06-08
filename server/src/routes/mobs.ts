import { Hono } from 'hono'
import { db } from '../db/client.js'
import { mobTemplates } from '../db/schema.js'
import { eq, like, or, and, isNull } from 'drizzle-orm'

export const mobsRouter = new Hono()

const SANDBOX_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000'

// GET /api/mobs — list/search mob templates
mobsRouter.get('/', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const q = c.req.query('q')
  const floor = c.req.query('floor')
  const elite = c.req.query('elite')
  const boss = c.req.query('boss')

  // Always scope queries to either global templates (campaignId is null) or this specific campaignId
  const filters = [
    or(eq(mobTemplates.campaignId, campaignId), isNull(mobTemplates.campaignId))
  ]

  if (q) filters.push(or(like(mobTemplates.name, `%${q}%`), like(mobTemplates.description, `%${q}%`)))
  if (floor) filters.push(eq(mobTemplates.floor, parseInt(floor)))
  if (elite === 'true') filters.push(eq(mobTemplates.isElite, true))
  if (boss === 'true') filters.push(eq(mobTemplates.isBoss, true))

  const results = await db.select().from(mobTemplates).where(and(...filters))
  return c.json(results)
})

// GET /api/mobs/:id
mobsRouter.get('/:id', async (c) => {
  const [mob] = await db.select().from(mobTemplates).where(eq(mobTemplates.id, c.req.param('id')))
  if (!mob) return c.json({ error: 'Not found' }, 404)
  return c.json(mob)
})

// POST / — create a custom campaign mob template
mobsRouter.post('/', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const body = await c.req.json()
  
  const [created] = await db.insert(mobTemplates).values({ ...body, campaignId }).returning()
  return c.json(created, 201)
})

// PUT /:id — update a custom campaign mob template
mobsRouter.put('/:id', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const { id } = c.req.param()
  const body = await c.req.json()

  // GMs should only be able to modify mob templates belonging to their active campaign (not global templates)
  const [updated] = await db.update(mobTemplates)
    .set(body)
    .where(and(eq(mobTemplates.id, id), eq(mobTemplates.campaignId, campaignId)))
    .returning()

  if (!updated) return c.json({ error: 'Mob template not found or not authorized to modify' }, 404)
  return c.json(updated)
})

// DELETE /:id — delete a custom campaign mob template
mobsRouter.delete('/:id', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const { id } = c.req.param()

  const [deleted] = await db.delete(mobTemplates)
    .where(and(eq(mobTemplates.id, id), eq(mobTemplates.campaignId, campaignId)))
    .returning()

  if (!deleted) return c.json({ error: 'Mob template not found or not authorized to delete' }, 404)
  return c.json({ ok: true })
})
