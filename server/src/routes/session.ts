import { Hono } from 'hono'
import { db } from '../db/client.js'
import { floorState, sessionSnapshots } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'

export const sessionRouter = new Hono()

const SANDBOX_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000'

// GET /api/session/floor — get current floor state
sessionRouter.get('/floor', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const [floor] = await db.select().from(floorState).where(eq(floorState.campaignId, campaignId)).limit(1)
  return c.json(floor ?? {})
})

// PATCH /api/session/floor — update floor state (GM only)
sessionRouter.patch('/floor', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const body = await c.req.json()
  const [updated] = await db.update(floorState)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(floorState.campaignId, campaignId))
    .returning()
  return c.json(updated)
})

// POST /api/session/init — create singleton floor row if missing
sessionRouter.post('/init', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const existing = await db.select().from(floorState).where(eq(floorState.campaignId, campaignId)).limit(1)
  if (existing.length > 0) return c.json({ ok: true, message: 'already initialised' })
  await db.insert(floorState).values({ campaignId })
  return c.json({ ok: true, message: 'initialised' })
})

// GET /api/session/snapshots — list all saved snapshots (name + id + createdAt only)
sessionRouter.get('/snapshots', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const snaps = await db.select({
    id: sessionSnapshots.id,
    name: sessionSnapshots.name,
    createdAt: sessionSnapshots.createdAt,
  }).from(sessionSnapshots).where(eq(sessionSnapshots.campaignId, campaignId)).orderBy(desc(sessionSnapshots.createdAt))
  return c.json(snaps)
})

// DELETE /api/session/snapshots/:id — delete a snapshot
sessionRouter.delete('/snapshots/:id', async (c) => {
  const { id } = c.req.param()
  await db.delete(sessionSnapshots).where(eq(sessionSnapshots.id, id))
  return c.json({ ok: true })
})
