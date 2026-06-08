import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authRouter } from './auth.js'
import { db } from '../db/client.js'
import { hashPassword, verifyPassword } from '../utils/crypto.js'

// Mock the database client
vi.mock('../db/client.js', () => {
  const mockDb = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    returning: vi.fn(),
  }

  mockDb.select.mockImplementation(() => mockDb)
  mockDb.from.mockImplementation(() => mockDb)
  mockDb.where.mockImplementation(() => mockDb)
  mockDb.limit.mockImplementation(() => mockDb)
  mockDb.insert.mockImplementation(() => mockDb)
  mockDb.values.mockImplementation(() => mockDb)
  mockDb.returning.mockImplementation(() => Promise.resolve([]))

  return {
    db: mockDb
  }
})

describe('Auth Routing & Cryptography Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Password Hashing Utilities', () => {
    it('should securely hash and successfully verify passwords', () => {
      const password = 'my-secure-password-123'
      const hashed = hashPassword(password)
      
      expect(hashed).toContain(':')
      expect(hashed.split(':')[0]).toHaveLength(32) // salt length in hex

      const isValid = verifyPassword(password, hashed)
      expect(isValid).toBe(true)

      const isInvalid = verifyPassword('wrong-password', hashed)
      expect(isInvalid).toBe(false)
    })
  })

  describe('Hono Auth Router endpoints', () => {
    it('register endpoint should reject empty payloads', async () => {
      const res = await authRouter.request('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('Email and password are required')
    })

    it('login endpoint should reject empty payloads', async () => {
      const res = await authRouter.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('Email and password are required')
    })
  })
})
