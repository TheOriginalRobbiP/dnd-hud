import { Hono } from 'hono'
import { db } from '../db/client.js'
import { items } from '../db/schema.js'
import { eq, like, or, and, isNull } from 'drizzle-orm'

export const itemsRouter = new Hono()

const SANDBOX_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000'

// GET /api/items — list/search items
itemsRouter.get('/', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const q = c.req.query('q')
  const tier = c.req.query('tier')
  const slot = c.req.query('slot')
  const floor = c.req.query('floor')

  // Always scope queries to either global items (campaignId is null) or this specific campaignId
  const filters = [
    or(eq(items.campaignId, campaignId), isNull(items.campaignId))
  ]

  if (q) filters.push(or(like(items.name, `%${q}%`), like(items.description, `%${q}%`)))
  if (tier) filters.push(eq(items.tier, tier))
  if (slot) filters.push(eq(items.slot, slot))
  if (floor) filters.push(eq(items.floorFound, parseInt(floor)))

  const results = await db.select().from(items).where(and(...filters))
  return c.json(results)
})

// GET /api/items/:id
itemsRouter.get('/:id', async (c) => {
  const [item] = await db.select().from(items).where(eq(items.id, c.req.param('id')))
  if (!item) return c.json({ error: 'Not found' }, 404)
  return c.json(item)
})

// POST / — create a custom campaign item
itemsRouter.post('/', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const body = await c.req.json()
  
  // Strip out auto-generated UUID fields if supplied, or let drizzle handle it
  const [created] = await db.insert(items).values({ ...body, campaignId }).returning()
  return c.json(created, 201)
})

// PUT /:id — update a custom campaign item
itemsRouter.put('/:id', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const { id } = c.req.param()
  const body = await c.req.json()

  // GMs should only be able to modify items belonging to their active campaign (not global templates)
  const [updated] = await db.update(items)
    .set(body)
    .where(and(eq(items.id, id), eq(items.campaignId, campaignId)))
    .returning()

  if (!updated) return c.json({ error: 'Item not found or not authorized to modify' }, 404)
  return c.json(updated)
})

// DELETE /:id — delete a custom campaign item
itemsRouter.delete('/:id', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const { id } = c.req.param()

  const [deleted] = await db.delete(items)
    .where(and(eq(items.id, id), eq(items.campaignId, campaignId)))
    .returning()

  if (!deleted) return c.json({ error: 'Item not found or not authorized to delete' }, 404)
  return c.json({ ok: true })
})
