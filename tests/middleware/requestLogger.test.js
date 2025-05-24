/* eslint-env jest */
'use strict'

const { requestLoggerMiddleware, getRequestLogs } = require('../../src/middleware/requestLogger')

function resetLogs () {
  getRequestLogs().length = 0
}

describe('requestLoggerMiddleware', () => {
  let req, res, next
  beforeEach(() => {
    resetLogs()
    res = {}
    next = jest.fn()
  })

  test('logs start game action', () => {
    req = { url: '/gaming/start', body: { gameID: 1 }, cookies: { playerID: 5, gameID: 1 } }
    requestLoggerMiddleware(req, res, next)
    const logs = getRequestLogs()
    expect(logs[logs.length - 1]).toEqual({
      players: 5,
      action: 'start game',
      details: 'Started game with ID: 1'
    })
  })

  test('skips unmapped actions', () => {
    req = { url: '/unmapped/endpoint', body: { foo: 'bar' }, cookies: { playerID: 1 } }
    requestLoggerMiddleware(req, res, next)
    expect(getRequestLogs().length).toBe(0)
  })

  test('skips logging if body is empty (except join game)', () => {
    req = { url: '/gaming/voting', body: {}, cookies: { playerID: 2 } }
    requestLoggerMiddleware(req, res, next)
    expect(getRequestLogs().length).toBe(0)
  })

  test('skips logging for sensitive endpoints', () => {
    req = { url: '/login', body: { email: 'a@b.com' }, cookies: { playerID: 4 } }
    requestLoggerMiddleware(req, res, next)
    expect(getRequestLogs().length).toBe(0)
  })

  test('cast vote logs only if vote is present', () => {
    req = { url: '/gaming/voting', body: { vote: 'player1' }, cookies: { playerID: 5 } }
    requestLoggerMiddleware(req, res, next)
    const logs = getRequestLogs()
    expect(logs[logs.length - 1]).toEqual({
      players: 5,
      action: 'cast vote',
      details: 'Voted for player: player1'
    })
  })

  test('logs join game with missing gameID in cookies', () => {
    req = { url: '/home/join', body: {}, cookies: { playerID: 3 } }
    requestLoggerMiddleware(req, res, next)
    const logs = getRequestLogs()
    expect(logs[logs.length - 1]).toEqual({
      players: 3,
      action: 'join game',
      details: 'Joined game with ID: unknown'
    })
  })

  test('logs with missing playerID in cookies', () => {
    req = { url: '/gaming/start', body: { gameID: 1 }, cookies: { gameID: 1 } }
    requestLoggerMiddleware(req, res, next)
    const logs = getRequestLogs()
    expect(logs[logs.length - 1].players).toBe('unknown')
  })

  test('skips logging for .css, .js, .html, and /scripts/ URLs', () => {
    const staticUrls = [
      '/scripts/test.js',
      '/styles/main.css',
      '/index.html',
      '/main.js'
    ]
    staticUrls.forEach(url => {
      req = { url, body: { foo: 'bar' }, cookies: { playerID: 1 } }
      requestLoggerMiddleware(req, res, next)
      expect(getRequestLogs().length).toBe(0)
    })
  })

  test('handles request with no cookies at all', () => {
    req = { url: '/gaming/start', body: { gameID: 1 } }
    requestLoggerMiddleware(req, res, next)
    const logs = getRequestLogs()
    expect(logs[logs.length - 1].players).toBe('unknown')
  })

  test('handles request with no body property', () => {
    req = { url: '/gaming/start', cookies: { playerID: 1, gameID: 1 } }
    requestLoggerMiddleware(req, res, next)
    // Should not log because body is undefined (treated as empty)
    expect(getRequestLogs().length).toBe(0)
  })

  test('handles request with non-object body', () => {
    req = { url: '/gaming/start', body: 'not-an-object', cookies: { playerID: 1, gameID: 1 } }
    requestLoggerMiddleware(req, res, next)
    // Should not log because body is not an object (treated as empty)
    expect(getRequestLogs().length).toBe(0)
  })

  test('skips logging for .css file', () => {
    req = { url: '/style.css', body: { foo: 'bar' }, cookies: { playerID: 1 } }
    requestLoggerMiddleware(req, res, next)
    expect(getRequestLogs().length).toBe(0)
  })

  test('skips logging for .js file', () => {
    req = { url: '/main.js', body: { foo: 'bar' }, cookies: { playerID: 1 } }
    requestLoggerMiddleware(req, res, next)
    expect(getRequestLogs().length).toBe(0)
  })

  test('skips logging for .html file', () => {
    req = { url: '/index.html', body: { foo: 'bar' }, cookies: { playerID: 1 } }
    requestLoggerMiddleware(req, res, next)
    expect(getRequestLogs().length).toBe(0)
  })

  test('skips logging for /scripts/ path', () => {
    req = { url: '/scripts/app.js', body: { foo: 'bar' }, cookies: { playerID: 1 } }
    requestLoggerMiddleware(req, res, next)
    expect(getRequestLogs().length).toBe(0)
  })

  test('skips logging for /login path', () => {
    req = { url: '/login', body: { foo: 'bar' }, cookies: { playerID: 1 } }
    requestLoggerMiddleware(req, res, next)
    expect(getRequestLogs().length).toBe(0)
  })

  test('skips logging for /createAccount path', () => {
    req = { url: '/createAccount', body: { foo: 'bar' }, cookies: { playerID: 1 } }
    requestLoggerMiddleware(req, res, next)
    expect(getRequestLogs().length).toBe(0)
  })

  test('skips logging if action is not mapped', () => {
    req = { url: '/not-mapped', body: { foo: 'bar' }, cookies: { playerID: 1 } }
    requestLoggerMiddleware(req, res, next)
    expect(getRequestLogs().length).toBe(0)
  })

  test('skips logging if formatter returns empty string', () => {
    req = { url: '/gaming/voting', body: {}, cookies: { playerID: 1 } }
    requestLoggerMiddleware(req, res, next)
    expect(getRequestLogs().length).toBe(0)
  })

  test('handles request with cookies as undefined', () => {
    req = { url: '/gaming/start', body: { gameID: 1 } }
    requestLoggerMiddleware(req, res, next)
    const logs = getRequestLogs()
    expect(logs[logs.length - 1].players).toBe('unknown')
  })

  test('handles request with body as undefined', () => {
    req = { url: '/gaming/start', cookies: { playerID: 1, gameID: 1 } }
    requestLoggerMiddleware(req, res, next)
    // Should not log because body is undefined (treated as empty)
    expect(getRequestLogs().length).toBe(0)
  })

  test('handles request with body as non-object', () => {
    req = { url: '/gaming/start', body: 'not-an-object', cookies: { playerID: 1, gameID: 1 } }
    requestLoggerMiddleware(req, res, next)
    // Should not log because body is not an object (treated as empty)
    expect(getRequestLogs().length).toBe(0)
  })

  test('logs join game with missing playerID and gameID', () => {
    req = { url: '/home/join', body: {} }
    requestLoggerMiddleware(req, res, next)
    const logs = getRequestLogs()
    expect(logs[logs.length - 1]).toEqual({
      players: 'unknown',
      action: 'join game',
      details: 'Joined game with ID: unknown'
    })
  })

  test('logs discussion message with non-text data', () => {
    req = {
      url: '/gaming/chatRoom',
      body: { customData: 'some value' },
      cookies: { playerID: 1, gameID: 1 }
    }
    requestLoggerMiddleware(req, res, next)
    const logs = getRequestLogs()
    expect(logs[logs.length - 1]).toEqual({
      players: 1,
      action: 'discussion message',
      details: `Message: ${JSON.stringify({ customData: 'some value' })}`
    })
  })
})

describe('socketLoggerMiddleware', () => {
  let socket, next
  beforeEach(() => {
    resetLogs()
    next = jest.fn()
    // Mock socket object with necessary properties and methods
    socket = {
      onAny: jest.fn(),
      handshake: {
        headers: {
          cookie: 'playerID=1; gameID=42'
        }
      }
    }
  })

  test('logs chat message event', () => {
    const { socketLoggerMiddleware } = require('../../src/middleware/requestLogger')
    socketLoggerMiddleware(socket, next)

    // Simulate a chat message event
    const eventHandler = socket.onAny.mock.calls[0][0]
    eventHandler('chat message', { text: 'Hello world' })

    const logs = getRequestLogs()
    expect(logs[logs.length - 1]).toEqual({
      players: '1',
      action: 'discussion message',
      details: 'Message: Hello world'
    })
  })

  test('logs start game event', () => {
    const { socketLoggerMiddleware } = require('../../src/middleware/requestLogger')
    socketLoggerMiddleware(socket, next)

    // Simulate a start game event
    const eventHandler = socket.onAny.mock.calls[0][0]
    eventHandler('start game', { gameID: 42 })

    const logs = getRequestLogs()
    expect(logs[logs.length - 1]).toEqual({
      players: '1',
      action: 'start game',
      details: 'Started game with ID: 42'
    })
  })

  test('skips unmapped events', () => {
    const { socketLoggerMiddleware } = require('../../src/middleware/requestLogger')
    socketLoggerMiddleware(socket, next)

    // Simulate an unmapped event
    const eventHandler = socket.onAny.mock.calls[0][0]
    eventHandler('unmapped_event', { data: 'test' })

    expect(getRequestLogs().length).toBe(0)
  })

  test('handles missing cookies', () => {
    const { socketLoggerMiddleware } = require('../../src/middleware/requestLogger')
    socket.handshake.headers.cookie = ''
    socketLoggerMiddleware(socket, next)

    // Simulate a chat message event
    const eventHandler = socket.onAny.mock.calls[0][0]
    eventHandler('chat message', { text: 'Hello world' })

    const logs = getRequestLogs()
    expect(logs[logs.length - 1].players).toBe('unknown')
  })

  test('skips empty data', () => {
    const { socketLoggerMiddleware } = require('../../src/middleware/requestLogger')
    socketLoggerMiddleware(socket, next)

    // Simulate an event with empty data
    const eventHandler = socket.onAny.mock.calls[0][0]
    eventHandler('chat message', {})

    expect(getRequestLogs().length).toBe(0)
  })

  test('calls next() after setting up event handler', () => {
    const { socketLoggerMiddleware } = require('../../src/middleware/requestLogger')
    socketLoggerMiddleware(socket, next)
    expect(next).toHaveBeenCalled()
  })
})
