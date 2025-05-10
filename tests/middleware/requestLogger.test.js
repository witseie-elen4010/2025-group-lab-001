/* eslint-env jest */
'use strict'

const { requestLoggerMiddleware, socketLoggerMiddleware, getRequestLogs } = require('@middleware/requestLogger')

describe('Request Logger Middleware', () => {
  let mockReq
  let mockRes
  let mockNext

  beforeEach(() => {
    mockReq = {
      url: '/test',
      method: 'GET',
      cookies: { playerID: '123' },
      body: {}
    }
    mockRes = {}
    mockNext = jest.fn()
  })

  test('should log HTTP requests', () => {
    requestLoggerMiddleware(mockReq, mockRes, mockNext)
    const logs = getRequestLogs()
    const lastLog = logs[logs.length - 1]

    expect(lastLog).toEqual({
      type: 'http',
      timestamp: expect.any(String),
      playerID: '123',
      method: 'GET',
      url: '/test',
      body: {}
    })
    expect(mockNext).toHaveBeenCalled()
  })

  test('should skip logging static files', () => {
    const initialLogsLength = getRequestLogs().length
    mockReq.url = '/scripts/test.js'

    requestLoggerMiddleware(mockReq, mockRes, mockNext)

    expect(getRequestLogs().length).toBe(initialLogsLength)
    expect(mockNext).toHaveBeenCalled()
  })

  test('should handle missing playerID cookie', () => {
    mockReq.cookies = {}

    requestLoggerMiddleware(mockReq, mockRes, mockNext)
    const logs = getRequestLogs()
    const lastLog = logs[logs.length - 1]

    expect(lastLog.playerID).toBe('unknown')
  })
})

describe('Socket Logger Middleware', () => {
  test('should log websocket events', () => {
    const mockSocket = {
      handshake: {
        headers: {
          cookie: 'playerID=456'
        }
      },
      onAny: jest.fn()
    }
    const mockNext = jest.fn()

    socketLoggerMiddleware(mockSocket, mockNext)

    // Simulate a websocket event
    const eventHandler = mockSocket.onAny.mock.calls[0][0]
    eventHandler('chat message', { text: 'test message' })

    const logs = getRequestLogs()
    const lastLog = logs[logs.length - 1]

    expect(lastLog).toEqual({
      type: 'websocket',
      timestamp: expect.any(String),
      playerID: '456',
      method: 'chat message',
      url: 'socket.io',
      body: { text: 'test message' }
    })
    expect(mockNext).toHaveBeenCalled()
  })

  test('should handle missing cookie in websocket connection', () => {
    const mockSocket = {
      handshake: {
        headers: {}
      },
      onAny: jest.fn()
    }
    const mockNext = jest.fn()

    socketLoggerMiddleware(mockSocket, mockNext)

    const eventHandler = mockSocket.onAny.mock.calls[0][0]
    eventHandler('chat message', { text: 'test message' })

    const logs = getRequestLogs()
    const lastLog = logs[logs.length - 1]

    expect(lastLog.playerID).toBe('unknown')
  })
})
