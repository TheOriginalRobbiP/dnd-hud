import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyMessage, getFullState } from './state.js'
import { db } from './client.js'

// Mock the drizzle client module to run tests in isolation without requiring a live Postgres instance
vi.mock('./client.js', () => {
  const mockDb = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    onConflictDoNothing: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }

  // Create chainable mock implementations
  mockDb.select.mockImplementation(() => mockDb)
  mockDb.from.mockImplementation(() => mockDb)
  mockDb.where.mockImplementation(() => mockDb)
  mockDb.orderBy.mockImplementation(() => mockDb)
  mockDb.limit.mockImplementation(() => Promise.resolve([])) // returns empty array by default
  mockDb.insert.mockImplementation(() => mockDb)
  mockDb.values.mockImplementation(() => mockDb)
  mockDb.onConflictDoNothing.mockImplementation(() => Promise.resolve({}))
  mockDb.update.mockImplementation(() => mockDb)
  mockDb.set.mockImplementation(() => mockDb)
  mockDb.delete.mockImplementation(() => mockDb)

  return {
    db: mockDb
  }
})

describe('DND HUD Core State Engine - Multi-Tenancy Scoping Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getFullState should scope all database selections by campaignId', async () => {
    const TEST_CAMPAIGN_ID = 'test-campaign-12345'
    
    // Setup Mock behavior for select
    const mockSelect = vi.spyOn(db, 'select')
    const mockWhere = vi.spyOn(db, 'where')
    
    await getFullState(TEST_CAMPAIGN_ID)

    // Verify select is called for characters, floorState, lootBoxes, and gmLog
    expect(mockSelect).toHaveBeenCalledTimes(5) // ensureFloorState does 1 select, then getFullState does 4 concurrent selects

    // Verify all selects are filtered using the campaignId
    expect(mockWhere).toHaveBeenCalled()
  })

  it('applyMessage should scope hp_update directly to character id', async () => {
    const mockUpdate = vi.spyOn(db, 'update')
    const mockSet = vi.spyOn(db, 'set')
    const mockWhere = vi.spyOn(db, 'where')

    const message = {
      type: 'hp_update' as const,
      charId: 'char-abc-123',
      hp: 15,
    }

    await applyMessage(message, 'my-campaign-id')

    expect(mockUpdate).toHaveBeenCalled()
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ hp: 15 }))
    expect(mockWhere).toHaveBeenCalled()
  })

  it('applyMessage should scope floor_update by the campaignId', async () => {
    const mockUpdate = vi.spyOn(db, 'update')
    const mockSet = vi.spyOn(db, 'set')

    const message = {
      type: 'floor_update' as const,
      floor: {
        floorNumber: 2,
        neighbourhoodName: 'The Courtyard',
      },
    }

    await applyMessage(message, 'my-campaign-id')

    expect(mockUpdate).toHaveBeenCalled()
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ floorNumber: 2 }))
  })
})
