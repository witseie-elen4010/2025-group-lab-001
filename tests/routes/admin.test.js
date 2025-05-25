/* eslint-env jest */
/* eslint-disable no-unused-vars */
'use strict'

const request = require('supertest')
const createApp = require('@config/express')
const jwt = require('jsonwebtoken')

// Tell ESLint to ignore mock patterns
/* eslint-disable-next-line no-unused-vars */
let mockLogs = []

// Mock the database module
/* eslint-disable-next-line no-unused-vars */
jest.mock('@config/db', () => {
  const mockRequest = {
    /* eslint-disable-next-line no-unused-expressions */
    input: jest.fn().mockReturnThis(),
    query: jest.fn().mockImplementation(async (query) => {
      if (query.includes('SELECT')) {
        return { recordset: mockLogs }
      } else if (query.includes('INSERT')) {
        const params = mockRequest.input.mock.calls.reduce((acc, [name, _, value]) => {
          /* eslint-disable-next-line no-param-reassign */
          acc[name] = value
          return acc
        }, {})

        const newLog = {
          players: params.players || 'unknown',
          action: params.action || 'unknown',
          details: params.details || '',
          timestamp: '2024-03-14T12:00:00.000Z'
        }
        mockLogs.unshift(newLog)
        mockRequest.input.mockClear()
        return { rowsAffected: [1] }
      }
      return { recordset: [] }
    })
  }

  return {
    getPool: jest.fn().mockResolvedValue({
      request: jest.fn().mockReturnValue(mockRequest)
    }),
    sql: {
      NVarChar: jest.fn(),
      DateTime2: jest.fn(),
      MAX: 'max'
    }
  }
})

describe('Admin Routes', () => {
  let app
  let token

  beforeEach(() => {
    app = createApp()
    mockLogs = []
    // Create a test token
    token = jwt.sign({
      username: 'testuser',
      playerId: 1,
      gameInfo: { gameId: 1 }
    }, 'your-secret-key')
  })

  describe('Admin Page', () => {
    test('should serve admin page', async () => {
      const response = await request(app)
        .get('/admin')

      expect(response.status).toBe(200)
      expect(response.type).toBe('text/html')
    })
  })

  describe('Logs API', () => {
    test('should return logs in JSON format', async () => {
      // Add a mock log entry
      mockLogs.push({
        players: 'testPlayer',
        action: 'test action',
        details: 'test details',
        timestamp: '2024-03-14T12:00:00.000Z'
      })

      const response = await request(app)
        .get('/admin/logs')

      expect(response.status).toBe(200)
      expect(response.type).toBe('application/json')
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBe(1)
    })

    test('should include request logs after making requests', async () => {
      // Make a sample request that will be logged
      await request(app)
        .post('/gaming/start')
        .set('Cookie', [`token=${token}`])
        .send({ gameID: 1 })

      // Wait a short time for the log to be processed
      await new Promise(resolve => setTimeout(resolve, 100))

      const response = await request(app)
        .get('/admin/logs')

      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('players')
      expect(response.body[0]).toHaveProperty('action')
      expect(response.body[0]).toHaveProperty('details')
      expect(response.body[0].timestamp).toBe('2024-03-14T12:00:00.000Z')
    })
  })
})
