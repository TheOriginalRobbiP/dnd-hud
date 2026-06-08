import { Hono } from 'hono'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { hashPassword, verifyPassword } from '../utils/crypto.js'
import { sign } from 'hono/jwt'

export const authRouter = new Hono()

const JWT_SECRET = process.env.JWT_SECRET ?? 'super-secret-key-change-in-prod'

// POST /api/auth/register — Register a new GM account
authRouter.post('/register', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 1. Check if email is already taken
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    if (existingUser) {
      return c.json({ error: 'Email is already registered' }, 400)
    }

    // 2. Hash password and insert
    const passwordHash = hashPassword(password)
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
      })
      .returning({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      })

    // 3. Generate JWT
    const token = await sign(
      {
        sub: newUser.id,
        email: newUser.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
      },
      JWT_SECRET
    )

    return c.json({
      user: newUser,
      token,
    })
  } catch (error: any) {
    console.error('[AUTH REGISTER ERROR]', error)
    return c.json({ error: 'Registration failed: ' + error.message }, 500)
  }
})

// POST /api/auth/login — Sign in as GM
authRouter.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 1. Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    // 2. Verify password hash
    const isValid = verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    // 3. Generate JWT
    const token = await sign(
      {
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
      },
      JWT_SECRET
    )

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    })
  } catch (error: any) {
    console.error('[AUTH LOGIN ERROR]', error)
    return c.json({ error: 'Login failed: ' + error.message }, 500)
  }
})

// GET /api/auth/me — Verify token and get current GM details
authRouter.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized: missing token' }, 401)
    }

    const token = authHeader.split(' ')[1]
    let payload
    try {
      // Hono native jwt verification
      const { verify } = await import('hono/jwt')
      payload = await verify(token, JWT_SECRET, 'HS256')
    } catch (err) {
      return c.json({ error: 'Unauthorized: invalid or expired token' }, 401)
    }

    // Look up user to make sure they still exist
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, payload.sub as string))
      .limit(1)

    if (!user) {
      return c.json({ error: 'Unauthorized: user not found' }, 401)
    }

    return c.json({ user })
  } catch (error: any) {
    return c.json({ error: 'Token verification failed: ' + error.message }, 500)
  }
})
