/* eslint-env jest */
const request = require('supertest')
const createApp = require('@config/express')
const Game = require('@models/Game')
const { GAME_STATES } = require('@config/gameConstants')

describe('Gaming Routes', () => {
  let app

  beforeEach(() => {
    app = createApp()
    Game.resetCounter() // Reset game state before each test
  })

  describe('Authentication Middleware', () => {
    test('should serve error page when accessing game without cookies', async () => {
      const response = await request(app).get('/gaming/waiting')
      expect(response.status).toBe(403)
    })

    test('should serve error page with invalid game ID', async () => {
      const response = await request(app)
        .get('/gaming/waiting')
        .set('Cookie', ['gameID=999; playerID=1'])
      expect(response.status).toBe(403)
      expect(response.type).toBe('text/html')
    })

    test('should serve error page with invalid player ID', async () => {
      // Create a game first
      const createResponse = await request(app).post('/create')
      const gameID = createResponse.headers['set-cookie']
        .find(cookie => cookie.startsWith('gameID='))

      const response = await request(app)
        .get('/gaming/waiting')
        .set('Cookie', [gameID, 'playerID=999'])

      expect(response.status).toBe(403)
    })
  })

  describe('Waiting Room', () => {
    test('should access waiting room with valid cookies', async () => {
      const createResponse = await request(app).post('/create')
      const cookies = createResponse.headers['set-cookie']

      const response = await request(app)
        .get('/gaming/waiting')
        .set('Cookie', cookies)

      expect(response.status).toBe(200)
      expect(response.type).toBe('text/html')
    })
  })

  describe('Player List API', () => {
    test('should get player list for valid game', async () => {
      const createResponse = await request(app).post('/create')
      const cookies = createResponse.headers['set-cookie']

      const response = await request(app)
        .get('/gaming/players')
        .set('Cookie', cookies)

      expect(response.status).toBe(200)
      expect(response.type).toBe('application/json')
      expect(response.body.players.length).toBe(1)
    })

    test('should deny invalid requests to player list', async () => {
      const response = await request(app)
        .get('/gaming/players')
        .set('Cookie', ['gameID=999; playerID=1'])

      expect(response.status).toBe(403)
    })
  })

  describe('Game State Management', () => {
    test('should allow host to start game', async () => {
      const createResponse = await request(app).post('/create')
      const cookies = createResponse.headers['set-cookie']

      const response = await request(app)
        .post('/gaming/start')
        .set('Cookie', cookies)

      expect(response.status).toBe(200)
      expect(response.text).toBe('Game started')
    })

    test('should deny non-host from starting game', async () => {
      // Create game first
      const createResponse = await request(app).post('/create')
      const gameID = createResponse.headers['set-cookie']
        .find(cookie => cookie.startsWith('gameID='))

      // Try to start with different player
      const response = await request(app)
        .post('/gaming/start')
        .set('Cookie', [gameID, 'playerID=999'])

      expect(response.status).toBe(403)
    })

    test('should return current game state', async () => {
      const createResponse = await request(app).post('/create')
      const cookies = createResponse.headers['set-cookie']

      const response = await request(app)
        .get('/gaming/state')
        .set('Cookie', cookies)

      expect(response.status).toBe(200)
      expect(response.body.state).toBe(GAME_STATES.WAITING)
    })
  })

  describe('Word Sharing API', () => {
    test('should get word for valid player', async () => {
      const createResponse = await request(app).post('/create')
      const cookies = createResponse.headers['set-cookie']

      const response = await request(app)
        .get('/gaming/wordShare')
        .set('Cookie', cookies)

      expect(response.status).toBe(200)
      expect(response.type).toBe('text/html')
    })

    test('should handle invalid requests to word sharing', async () => {
      const response = await request(app)
        .get('/gaming/wordShare')
        .set('Cookie', ['gameID=999; playerID=1'])

      expect(response.status).toBe(403)
      expect(response.type).toBe('text/html')
    })
  })

  describe('Player ID API', () => {
    test('should get player ID for valid game', async () => {
      const createResponse = await request(app).post('/create')
      const cookies = createResponse.headers['set-cookie']

      const response = await request(app)
        .get('/gaming/playerID')
        .set('cookie', cookies)
      expect(response.status).toBe(200)
      expect(response.type).toBe('application/json')
      expect(response.body).toHaveProperty('playerID')
    })

    test('should handle invalid requests to player ID', async () => {
      const response = await request(app)
        .get('/gaming/playerID')
        .set('Cookie', ['gameID=999; playerID=1'])

      expect(response.status).toBe(403)
      expect(response.type).toBe('text/html')
    })
  })
})
