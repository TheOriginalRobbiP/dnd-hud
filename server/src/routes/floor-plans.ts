import { Hono } from 'hono'
import { db } from '../db/client.js'
import { floorPlans, floorRooms, roomConnections } from '../db/schema.js'
import { eq, desc } from 'drizzle-orm'

export const floorPlansRouter = new Hono()

const SANDBOX_CAMPAIGN_ID = '00000000-0000-0000-0000-000000000000'

// ── Floor Plans ───────────────────────────────────────────────

// GET / — list all floor plans ordered by createdAt desc
floorPlansRouter.get('/', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const plans = await db.select().from(floorPlans).where(eq(floorPlans.campaignId, campaignId)).orderBy(desc(floorPlans.createdAt))
  return c.json(plans)
})

// POST / — create a new floor plan
floorPlansRouter.post('/', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const body = await c.req.json()
  const [created] = await db.insert(floorPlans).values({ ...body, campaignId }).returning()
  return c.json(created, 201)
})

// GET /:id — get floor plan + its rooms + its connections
floorPlansRouter.get('/:id', async (c) => {
  const { id } = c.req.param()
  const [plan] = await db.select().from(floorPlans).where(eq(floorPlans.id, id))
  if (!plan) return c.json({ error: 'Not found' }, 404)

  const rooms = await db.select().from(floorRooms).where(eq(floorRooms.floorPlanId, id))
  const connections = await db.select().from(roomConnections).where(eq(roomConnections.floorPlanId, id))

  return c.json({ ...plan, rooms, connections })
})

// PUT /:id — update floor plan fields
floorPlansRouter.put('/:id', async (c) => {
  const campaignId = c.req.query('campaignId') || SANDBOX_CAMPAIGN_ID
  const { id } = c.req.param()
  const body = await c.req.json()

  // If setting this plan to active, deactivate all other plans in this campaign first
  if (body.isActive === true) {
    await db.update(floorPlans).set({ isActive: false }).where(eq(floorPlans.campaignId, campaignId))
  }

  const [updated] = await db.update(floorPlans)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(floorPlans.id, id))
    .returning()
  if (!updated) return c.json({ error: 'Not found' }, 404)
  return c.json(updated)
})

// DELETE /:id — delete floor plan (cascade handles rooms + connections)
floorPlansRouter.delete('/:id', async (c) => {
  const { id } = c.req.param()
  await db.delete(floorPlans).where(eq(floorPlans.id, id))
  return c.json({ ok: true })
})

// ── Rooms ─────────────────────────────────────────────────────

// GET /:id/rooms — list rooms for a floor plan
floorPlansRouter.get('/:id/rooms', async (c) => {
  const { id } = c.req.param()
  const rooms = await db.select().from(floorRooms).where(eq(floorRooms.floorPlanId, id))
  return c.json(rooms)
})

// POST /:id/rooms — create a room under this floor plan
floorPlansRouter.post('/:id/rooms', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()
  const [created] = await db.insert(floorRooms).values({ ...body, floorPlanId: id }).returning()
  return c.json(created, 201)
})

// PUT /:id/rooms/:roomId — update a room
floorPlansRouter.put('/:id/rooms/:roomId', async (c) => {
  const { roomId } = c.req.param()
  const body = await c.req.json()
  const [updated] = await db.update(floorRooms)
    .set(body)
    .where(eq(floorRooms.id, roomId))
    .returning()
  if (!updated) return c.json({ error: 'Not found' }, 404)
  return c.json(updated)
})

// POST /:id/rooms/:roomId/enter — set this room as current & visited, and unset other current rooms
floorPlansRouter.post('/:id/rooms/:roomId/enter', async (c) => {
  const { id, roomId } = c.req.param()

  // 1. Mark all other rooms in this floor plan as not current
  await db.update(floorRooms)
    .set({ isCurrentRoom: false })
    .where(eq(floorRooms.floorPlanId, id))

  // 2. Mark this room as current and visited
  const [updated] = await db.update(floorRooms)
    .set({ isCurrentRoom: true, isVisited: true })
    .where(eq(floorRooms.id, roomId))
    .returning()

  if (!updated) return c.json({ error: 'Room not found' }, 404)
  return c.json(updated)
})

// DELETE /:id/rooms/:roomId — delete a room (cascade handles its connections)
floorPlansRouter.delete('/:id/rooms/:roomId', async (c) => {
  const { roomId } = c.req.param()
  await db.delete(floorRooms).where(eq(floorRooms.id, roomId))
  return c.json({ ok: true })
})

// ── Connections ───────────────────────────────────────────────

// POST /:id/connections — create a connection
floorPlansRouter.post('/:id/connections', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()
  const [created] = await db.insert(roomConnections).values({ ...body, floorPlanId: id }).returning()
  return c.json(created, 201)
})

// DELETE /:id/connections/:connId — delete a connection
floorPlansRouter.delete('/:id/connections/:connId', async (c) => {
  const { connId } = c.req.param()
  await db.delete(roomConnections).where(eq(roomConnections.id, connId))
  return c.json({ ok: true })
})
