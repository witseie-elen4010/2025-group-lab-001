/* eslint-env jest */
'use strict'

const { requestLoggerMiddleware, getRequestLogs, socketLoggerMiddleware } = require('@middleware/requestLogger')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'your-secret-key'

// Mock database logs
let mockLogs = []
const mockInputParams = []

// Mock the database module
jest.mock('@config/db', () => {
  let inputParams = []
  const mockRequest = {
    input: jest.fn().mockImplementation((name, type, value) => {
      inputParams.push({ name, type, value })
      return mockRequest
    }),
    query: jest.fn().mockImplementation(async (query) => {
      if (query.includes('SELECT')) {
        return { recordset: mockLogs }
      } else if (query.includes('INSERT')) {
        const newLog = {
          players: inputParams.find(p => p.name === 'players')?.value || 'unknown',
          action: inputParams.find(p => p.name === 'action')?.value || 'unknown',
          details: inputParams.find(p => p.name === 'details')?.value || '',
          timestamp: inputParams.find(p => p.name === 'timestamp')?.value || new Date().toISOString()
        }
        mockLogs.unshift(newLog)
        inputParams = [] // Reset params after use
        return { rowsAffected: [1] }
      }
      return { rowsAffected: [0] }
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
    // Mock Date.now() to return a consistent timestamp
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-03-14T12:00:00.000Z')
  })

  afterEach(() => {
    jest.restoreAllMocks()
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
