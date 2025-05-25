/* eslint-env jest */
'use strict'

const { requestLoggerMiddleware, socketLoggerMiddleware } = require('@middleware/requestLogger')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'your-secret-key'

// Mock database logs
let mockLogs = []

// Mock the database module
jest.mock('@config/db', () => {
  const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: jest.fn().mockImplementation(async (query) => {
      if (query.includes('SELECT')) {
        return { recordset: mockLogs }
      } else if (query.includes('INSERT')) {
        // Get the input parameters from the most recent calls to input()
        const params = mockRequest.input.mock.calls.reduce((acc, [name, _, value]) => {
          acc[name] = value
          return acc
        }, {})

        const newLog = {
          players: params.players || 'unknown',
          action: params.action || 'unknown',
          details: params.details || '',
          timestamp: '2024-03-14T12:00:00.000Z' // Use fixed timestamp
        }
        mockLogs.unshift(newLog)
        mockRequest.input.mockClear() // Clear input call history
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

function createTestToken (playerId, gameId) {
  return jwt.sign({
    username: 'testUser',
    playerId,
    gameInfo: { gameId, isHost: true }
  }, JWT_SECRET)
}

describe('requestLoggerMiddleware', () => {
  let req, res, next

  beforeEach(() => {
    mockLogs = []
    req = {
      url: '',
      body: {},
      cookies: {}
    }
    res = {}
    next = jest.fn()
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-03-14T12:00:00.000Z')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    mockLogs = []
  })

  test('logs start game action', async () => {
    const token = createTestToken(5, 1)
    req.url = '/gaming/start'
    req.body = { gameID: 1 }
    req.cookies.token = token

    await requestLoggerMiddleware(req, res, next)

    expect(mockLogs[0]).toEqual({
      players: '5',
      action: 'start game',
      details: 'Started game with ID: 1',
      timestamp: '2024-03-14T12:00:00.000Z'
    })
    expect(next).toHaveBeenCalled()
  })

  test('skips unmapped actions', async () => {
    req.url = '/unmapped/endpoint'
    req.body = { foo: 'bar' }
    req.cookies.token = createTestToken(1, 1)

    await requestLoggerMiddleware(req, res, next)
    expect(mockLogs.length).toBe(0)
    expect(next).toHaveBeenCalled()
  })

  test('handles request with no cookies', async () => {
    req.url = '/gaming/start'
    req.body = { gameID: 1 }
    req.cookies = undefined

    await requestLoggerMiddleware(req, res, next)
    expect(mockLogs[0]).toEqual({
      players: 'unknown',
      action: 'start game',
      details: 'Started game with ID: 1',
      timestamp: '2024-03-14T12:00:00.000Z'
    })
    expect(next).toHaveBeenCalled()
  })

  test('skips static files', async () => {
    const staticFiles = [
      '/scripts/app.js',
      '/style.css',
      '/index.html',
      '/login',
      '/createAccount'
    ]

    for (const url of staticFiles) {
      req.url = url
      await requestLoggerMiddleware(req, res, next)
      expect(mockLogs.length).toBe(0)
      expect(next).toHaveBeenCalled()
    }
  })
})

describe('socketLoggerMiddleware', () => {
  let socket, next

  beforeEach(() => {
    mockLogs = []
    next = jest.fn()
    const token = createTestToken(1, 42)
    socket = {
      onAny: jest.fn(),
      handshake: {
        headers: {
          cookie: `token=${token}`
        }
      }
    }
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-03-14T12:00:00.000Z')
  })

  test('logs chat message event', async () => {
    socketLoggerMiddleware(socket, next)

    const handler = socket.onAny.mock.calls[0][0]
    await handler('chat message', { text: 'Hello world' })

    expect(mockLogs[0]).toEqual({
      players: '1',
      action: 'discussion message',
      details: 'Message: Hello world',
      timestamp: '2024-03-14T12:00:00.000Z'
    })
    expect(next).toHaveBeenCalled()
  })

  test('calls next() after setup', () => {
    socketLoggerMiddleware(socket, next)
    expect(next).toHaveBeenCalled()
  })
})
