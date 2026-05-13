import { Hono } from 'hono'
import { db } from '../db/client.js'
import { characters } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export const charactersRouter = new Hono()

// GET /api/characters — list all
charactersRouter.get('/', async (c) => {
  const all = await db.select().from(characters)
  return c.json(all)
})

// GET /api/characters/:id
charactersRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const [char] = await db.select().from(characters).where(eq(characters.id, id))
  if (!char) return c.json({ error: 'Not found' }, 404)
  return c.json(char)
})

// POST /api/characters — create (GM only)
charactersRouter.post('/', async (c) => {
  const body = await c.req.json()
  const [created] = await db.insert(characters).values({
    crawlerName: body.crawlerName,
    playerName: body.playerName,
    hp: body.hp ?? 10,
    maxHp: body.maxHp ?? 10,
    mp: body.mp ?? 0,
    maxMp: body.maxMp ?? 0,
    stats: body.stats ?? { STR: 4, DEX: 4, CON: 4, INT: 4, CHA: 4, WIS: 4 },
    skills: body.skills ?? [],
    equipment: body.equipment ?? {},
    inventory: body.inventory ?? [],
    achievements: body.achievements ?? [],
    viewerCount: body.viewerCount ?? 1000,
    sponsors: body.sponsors ?? [],
    statusEffects: body.statusEffects ?? [],
    notes: body.notes ?? '',
  }).returning()
  return c.json(created, 201)
})

// PATCH /api/characters/:id — update character data (GM only)
charactersRouter.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const [updated] = await db.update(characters)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(characters.id, id))
    .returning()
  if (!updated) return c.json({ error: 'Not found' }, 404)
  return c.json(updated)
})

// DELETE /api/characters/:id
charactersRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await db.delete(characters).where(eq(characters.id, id))
  return c.json({ ok: true })
})
