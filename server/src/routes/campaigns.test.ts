import { describe, it, expect, vi, beforeEach } from 'vitest'
import { campaignsRouter } from './campaigns.js'
import { db } from '../db/client.js'

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
  mockDb.limit.mockImplementation(() => Promise.resolve([]))
  mockDb.insert.mockImplementation(() => mockDb)
  mockDb.values.mockImplementation(() => mockDb)
  mockDb.returning.mockImplementation(() => Promise.resolve([]))

  return {
    db: mockDb
  }
})

describe('Campaigns Router Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/campaigns should reject unauthorized requests with 401', async () => {
    const res = await campaignsRouter.request('/', {
      method: 'GET',
    })

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('POST /api/campaigns should reject unauthorized requests with 401', async () => {
    const res = await campaignsRouter.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Campaign', slug: 'camp', roomCode: '1234' }),
    })

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('GET /api/campaigns/by-slug/:slug should return 404 when campaign not found', async () => {
    const res = await campaignsRouter.request('/by-slug/nonexistent', {
      method: 'GET',
    })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Campaign not found')
  })

  it('GET /api/campaigns/by-pin/:pin should return 404 when campaign not found', async () => {
    const res = await campaignsRouter.request('/by-pin/9999', {
      method: 'GET',
    })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Campaign not found for this PIN')
  })
})
