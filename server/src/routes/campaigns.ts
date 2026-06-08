import { Hono } from 'hono'
import { db } from '../db/client.js'
import { campaigns, floorState } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { verify } from 'hono/jwt'

export const campaignsRouter = new Hono()

const JWT_SECRET = process.env.JWT_SECRET ?? 'super-secret-key-change-in-prod'

// Helper to authenticate GM token and return user ID
async function authenticateGM(c: any): Promise<string | null> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = await verify(token, JWT_SECRET, 'HS256')
    return payload.sub as string
  } catch (err) {
    return null
  }
}

// GET /api/campaigns/by-slug/:slug — Resolve a public campaign by its URL slug
campaignsRouter.get('/by-slug/:slug', async (c) => {
  const { slug } = c.req.param()
  try {
    const [camp] = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        slug: campaigns.slug,
        themeConfig: campaigns.themeConfig,
        rulesetConfig: campaigns.rulesetConfig,
        isActive: campaigns.isActive,
      })
      .from(campaigns)
      .where(eq(campaigns.slug, slug.toLowerCase().trim()))
      .limit(1)

    if (!camp) {
      return c.json({ error: 'Campaign not found' }, 404)
    }

    return c.json(camp)
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// GET /api/campaigns — List all campaigns owned by the authenticated GM
campaignsRouter.get('/', async (c) => {
  const gmId = await authenticateGM(c)
  if (!gmId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const list = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.gmId, gmId))
    
    return c.json(list)
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

// POST /api/campaigns — Create a new campaign
campaignsRouter.post('/', async (c) => {
  const gmId = await authenticateGM(c)
  if (!gmId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { name, slug, roomCode, rulesetPreset } = await c.req.json()

    if (!name || !slug || !roomCode) {
      return c.json({ error: 'Name, unique slug, and player room code are required' }, 400)
    }

    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '').trim()

    // 1. Check if slug is unique
    const [existingSlug] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.slug, normalizedSlug))
      .limit(1)

    if (existingSlug) {
      return c.json({ error: 'Campaign slug is already taken' }, 400)
    }

    // 2. Check if roomCode is unique
    const [existingRoomCode] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.roomCode, roomCode))
      .limit(1)

    if (existingRoomCode) {
      return c.json({ error: 'Player room code is already taken. Choose a different PIN.' }, 400)
    }

    // 3. Define default rulesetConfig based on user-selected preset
    let rulesetConfig = {
      preset: rulesetPreset || 'dcc',
      gameType: rulesetPreset === 'classic-fantasy' ? 'Dark Fantasy' : 'Sci-Fi Crawler',
      terminology: {
        currency: rulesetPreset === 'classic-fantasy' ? 'Gold Pieces' : 'Gold',
        favour: rulesetPreset === 'classic-fantasy' ? 'Inspiration Points' : 'AI Favour Tokens',
        sponsor: rulesetPreset === 'classic-fantasy' ? 'Guild Backing' : 'Sponsors',
        level: rulesetPreset === 'classic-fantasy' ? 'Dungeon Level' : 'Floor',
        mob: rulesetPreset === 'classic-fantasy' ? 'Monster' : 'Mob',
      },
      features: {
        sponsorsEnabled: true,
        favourEnabled: true,
        lootBoxesEnabled: rulesetPreset !== 'classic-fantasy',
        preTutorialWarningEnabled: rulesetPreset !== 'classic-fantasy',
        spectatorMeterEnabled: true,
      }
    }

    // Default theme based on preset
    let themeConfig = rulesetPreset === 'classic-fantasy' 
      ? {
          canvasColor: '#f4eee2', // sand
          primaryColor: '#0b2540', // navy
          accentColor: '#e8a957', // amber
          surfaceColor: '#e9e2d3',
          borderColor: '#d2c7b5',
          textColor: '#1a1a1a',
        }
      : {
          canvasColor: '#070B14', // obsidian bg
          primaryColor: '#7B2FFF', // street violet
          accentColor: '#FFB800', // high-vis gold
          surfaceColor: '#0D1426',
          borderColor: '#1f2d4d',
          textColor: '#f8fafc',
        }

    // 4. Insert Campaign
    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        gmId,
        name,
        slug: normalizedSlug,
        roomCode,
        rulesetConfig,
        themeConfig,
      })
      .returning()

    // 5. Initialize active Floor State record for this campaign!
    await db
      .insert(floorState)
      .values({
        campaignId: newCampaign.id,
        sessionActive: false,
        floorNumber: 1,
        neighbourhoodName: rulesetPreset === 'classic-fantasy' ? 'The Dungeon Entrance' : 'The Commons',
        roomNumber: 1,
        roomTarget: 10,
        roomDescription: 'Welcome to your brand new campaign!',
      })

    return c.json(newCampaign)
  } catch (error: any) {
    console.error('[CREATE CAMPAIGN ERROR]', error)
    return c.json({ error: 'Failed to create campaign: ' + error.message }, 500)
  }
})

// GET /api/campaigns/by-pin/:pin — Lookup campaign by 4-digit room code PIN
campaignsRouter.get('/by-pin/:pin', async (c) => {
  const { pin } = c.req.param()
  try {
    const [camp] = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        slug: campaigns.slug,
        themeConfig: campaigns.themeConfig,
        rulesetConfig: campaigns.rulesetConfig,
        isActive: campaigns.isActive,
      })
      .from(campaigns)
      .where(eq(campaigns.roomCode, pin.trim()))
      .limit(1)

    if (!camp) {
      return c.json({ error: 'Campaign not found for this PIN' }, 404)
    }

    return c.json(camp)
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})
