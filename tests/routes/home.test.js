/* eslint-env jest */
'use strict'

const request = require('supertest')
const createApp = require('@config/express')
const Game = require('@models/Game')
const accountFunctions = require('@controllers/accountFunctions')

describe('Home Routes', () => {
  let app
  let token
  let account

  beforeEach(async () => {
    app = createApp()
    Game.resetCounter()
    // Create test account and get token
    const uniqueEmail = `test${Date.now()}@example.com`
    const uniqueUsername = `test${Date.now()}`
    account = await accountFunctions.createAccount(
      uniqueEmail,
      uniqueUsername,
      'Password123',
      'Password123'
    )
  })

  describe('GET /home', () => {
    test('should serve home page for authenticated user', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get('/home')
        .set('Cookie', [`token=${token}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })

    test('should redirect to login for unauthenticated user', async () => {
      const response = await request(app)
        .get('/home')
        .expect(302)

      expect(response.header.location).toBe('/login')
    })
  })

  describe('GET /home/create', () => {
    test('should serve create game page for authenticated user', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get('/home/create')
        .set('Cookie', [`token=${token}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })

    test('should redirect to login for unauthenticated user', async () => {
      const response = await request(app)
        .get('/home/create')
        .expect(302)

      expect(response.header.location).toBe('/login')
    })
  })

  describe('POST /home/createGame', () => {
    test('should create game and redirect to waiting room', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .post('/home/createGame')
        .set('Cookie', [`token=${token}`])
        .send({ totalRounds: 3 })
        .expect(302)

      expect(response.header.location).toBe('/gaming/waiting')
      expect(response.header['set-cookie']).toBeTruthy()
      expect(response.header['set-cookie'][0]).toMatch(/token=/)
    })

    test('should handle server error gracefully', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      // Mock Game.createGame to throw an error
      const originalCreateGame = Game.createGame
      Game.createGame = jest.fn().mockImplementation(() => {
        throw new Error('Game creation failed')
      })

      const response = await request(app)
        .post('/home/createGame')
        .set('Cookie', [`token=${token}`])
        .send({ totalRounds: 3 })
        .expect(500)

      expect(response.text).toBe('Error creating game')

      // Restore original function
      Game.createGame = originalCreateGame
    })
  })

  describe('POST /home/joinGame', () => {
    test('should join game and redirect to waiting room', async () => {
      const game = Game.createGame(account.playerId)
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .post('/home/joinGame')
        .set('Cookie', [`token=${token}`])
        .send({ gameID: game.gameID })
        .expect(302)

      expect(response.header.location).toBe('/gaming/waiting')
      expect(response.header['set-cookie']).toBeTruthy()
      expect(response.header['set-cookie'][0]).toMatch(/token=/)
    })

    test('should return 404 for non-existent game', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .post('/home/joinGame')
        .set('Cookie', [`token=${token}`])
        .send({ gameID: 999 })
        .expect(404)

      expect(response.text).toBe('Game not found')
    })

    test('should return 403 when game is full', async () => {
      const game = Game.createGame(account.playerId)
      // Fill up the game
      for (let i = 0; i < game.maxPlayers; i++) {
        game.createPlayer(i + 2)
      }

      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .post('/home/joinGame')
        .set('Cookie', [`token=${token}`])
        .send({ gameID: game.gameID })
        .expect(403)

      expect(response.text).toBe('Game is full')
    })
  })

  describe('GET /home/spectate', () => {
    test('should allow spectating valid game', async () => {
      const game = Game.createGame(account.playerId)
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get(`/home/spectate?gameID=${game.gameID}`)
        .set('Cookie', [`token=${token}`])
        .expect(302)

      expect(response.header.location).toBe('/gaming/waiting')
      expect(response.header['set-cookie']).toBeTruthy()
      expect(response.header['set-cookie'][0]).toMatch(/token=/)
    })

    test('should return 404 for non-existent game', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get('/home/spectate?gameID=999')
        .set('Cookie', [`token=${token}`])
        .expect(404)

      expect(response.text).toBe('Game not found')
    })
  })

  describe('GET /home/open-lobbies', () => {
    test('should return list of open games', async () => {
      const game1 = Game.createGame(account.playerId)
      const game2 = Game.createGame(account.playerId + 1)
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get('/home/open-lobbies')
        .set('Cookie', [`token=${token}`])
        .expect(200)

      expect(response.body).toHaveProperty('lobbies')
      expect(response.body.lobbies.length).toBe(2)
      expect(response.body.lobbies[0]).toHaveProperty('id', game1.gameID)
      expect(response.body.lobbies[1]).toHaveProperty('id', game2.gameID)
    })

    test('should handle server error gracefully', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      // Mock Game.getAllGames to throw an error
      const originalGetAllGames = Game.getAllGames
      Game.getAllGames = jest.fn().mockImplementation(() => {
        throw new Error('Failed to fetch games')
      })

      const response = await request(app)
        .get('/home/open-lobbies')
        .set('Cookie', [`token=${token}`])
        .expect(500)

      expect(response.body).toHaveProperty('error', 'Failed to fetch lobbies')

      // Restore original function
      Game.getAllGames = originalGetAllGames
    })
  })

  describe('GET /home/join', () => {
    test('should serve join page for authenticated user', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get('/home/join')
        .set('Cookie', [`token=${token}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })

    test('should redirect to login for unauthenticated user', async () => {
      const response = await request(app)
        .get('/home/join')
        .expect(302)

      expect(response.header.location).toBe('/login')
    })
  })
})
