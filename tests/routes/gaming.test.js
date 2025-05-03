/* eslint-env jest */
const request = require('supertest')
const createApp = require('@config/express')
const Game = require('@models/Game')

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
      expect(response.type).toBe('text/html')
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
      const createResponse = await request(app).get('/create')
      const gameID = createResponse.headers['set-cookie']
        .find(cookie => cookie.startsWith('gameID='))

      const response = await request(app)
        .get('/gaming/waiting')
        .set('Cookie', [gameID, 'playerID=999'])

      expect(response.status).toBe(200)
      expect(response.type).toBe('text/html')
    })
  })

  describe('Waiting Room', () => {
    test('should access waiting room with valid cookies', async () => {
      const createResponse = await request(app).get('/create')
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
      const createResponse = await request(app).get('/create')
      const cookies = createResponse.headers['set-cookie']

      const response = await request(app)
        .get('/gaming/players')
        .set('Cookie', cookies)

      expect(response.status).toBe(200)
      expect(response.type).toBe('application/json')
      expect(response.body).toHaveProperty('players')
      expect(response.body.players).toBeInstanceOf(Array)
      expect(response.body.players.length).toBe(1)
    })

    test('should handle invalid requests to player list', async () => {
      const response = await request(app)
        .get('/gaming/players')
        .set('Cookie', ['gameID=999; playerID=1'])

      expect(response.status).toBe(200)
      expect(response.type).toBe('text/html')
    })
  })

  describe('Player ID API', () => {
    test('should get player ID for valid game', async () => {
      const createResponse = await request(app).get('/create')
      const cookies = createResponse.headers['set-cookie']

      const response = await request(app)
        .get('/gaming/playerID')
        .set('Cookie', cookies)

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
