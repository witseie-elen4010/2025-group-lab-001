'use strict'

/* eslint-env jest */
const request = require('supertest')
const createApp = require('@config/express')
const Game = require('@models/Game')
const { GAME_STATES } = require('@config/gameConstants')
const accountFunctions = require('@controllers/accountFunctions')

describe('Gaming Routes', () => {
  let app
  let token
  let account

  beforeEach(async () => {
    app = createApp()
    Game.resetCounter() // Reset game state before each test
    // Create test account and get token with unique email
    const uniqueEmail = `test${Date.now()}@pf.org`
    const uniqueUsername = `test${Date.now()}`
    account = await accountFunctions.createAccount(
      uniqueEmail,
      uniqueUsername,
      '123',
      '123'
    )
  })

  describe('Authentication Middleware', () => {
    test('should redirect player to login page when the player does not have cookies', async () => {
      const response = await request(app).get('/gaming/waiting')
      expect(response.status).toBe(302)
      expect(response.header.location).toBe('/login')
    })

    test('should serve error page with invalid game ID', async () => {
      const gameInfo = {
        gameId: 999,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get('/gaming/waiting')
        .set('Cookie', [`token=${token}`])
      expect(response.status).toBe(403)
      expect(response.type).toBe('text/html')
    })
  })

  describe('Waiting Room', () => {
    test('should access waiting room with valid cookies', async () => {
      const game = Game.createGame(1)
      game.createPlayer(account.playerId)
      const gameInfo = {
        gameId: game.gameID,
        isHost: true,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get('/gaming/waiting')
        .set('Cookie', [`token=${token}`])

      expect(response.status).toBe(200)
      expect(response.type).toBe('text/html')
    })
  })

  describe('Player List API', () => {
    test('should get player list for valid game', async () => {
      const game = Game.createGame(account.playerId)
      const gameInfo = {
        gameId: game.gameID,
        isHost: true,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get('/gaming/players')
        .set('Cookie', [`token=${token}`])
      expect(response.status).toBe(200)
      expect(response.type).toBe('application/json')
      expect(response.body.players.length).toBe(1)
    })

    test('should deny invalid requests to player list', async () => {
      const gameInfo = {
        gameId: 999,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get('/gaming/players')
        .set('Cookie', [`token=${token}`])

      expect(response.status).toBe(403)
    })
  })

  describe('Game State Management', () => {
    test('should allow host to start game', async () => {
      const game = Game.createGame(account.playerId)
      const gameInfo = {
        gameId: game.gameID,
        isHost: true,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .post('/gaming/start')
        .set('Cookie', [`token=${token}`])

      expect(response.status).toBe(200)
      expect(response.text).toBe('Game started')
    })

    test('should deny non-host from starting game', async () => {
      const game = Game.createGame(account.playerId)
      const gameInfo = {
        gameId: game.gameID,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .post('/gaming/start')
        .set('Cookie', [`token=${token}`])

      expect(response.status).toBe(403)
    })

    test('should return current game state', async () => {
      const game = Game.createGame(account.playerId)
      const gameInfo = {
        gameId: game.gameID,
        isHost: true,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get('/gaming/state')
        .set('Cookie', [`token=${token}`])

      expect(response.status).toBe(200)
      expect(response.body.state).toBe(GAME_STATES.WAITING)
    })
  })

  describe('Word Sharing API', () => {
    test('should get word for valid player', async () => {
      const game = Game.createGame(account.playerId)
      const gameInfo = {
        gameId: game.gameID,
        isHost: true,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      const response = await request(app)
        .get('/gaming/wordShare')
        .set('Cookie', [`token=${token}`])

      expect(response.status).toBe(200)
      expect(response.type).toBe('text/html')
    })

    test('should redirect to login for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/gaming/wordShare')
        .expect(302)

      expect(response.header.location).toBe('/login')
    })
  })

  describe('Player ID API', () => {
    test('should get player ID for valid game', async () => {
      const game = Game.createGame(account.playerId)
      const gameInfo = {
        gameId: game.gameID,
        isHost: true,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)
      const response = await request(app)
        .get('/gaming/playerID')
        .set('Cookie', [`token=${token}`])
      expect(response.status).toBe(200)
      expect(response.type).toBe('application/json')
      expect(response.body).toHaveProperty('playerID', account.playerId)
    })

    test('should redirect to login for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/gaming/playerID')
        .expect(302)

      expect(response.header.location).toBe('/login')
    })
  })

  test('GET /home/invite should create player and redirect when given valid gameID', async () => {
    const game = Game.createGame(account.playerId)
    const gameInfo = {
      gameId: game.gameID,
      isHost: false,
      isSpectator: false
    }
    token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

    const response = await request(app)
      .get(`/home/invite?gameID=${game.gameID}`)
      .set('Cookie', [`token=${token}`])
      .expect(302)

    expect(response.header.location).toBe('/gaming/waiting')
    expect(response.header['set-cookie']).toBeTruthy()
  })

  test('GET /home/invite should return 404 for non-existent gameID', async () => {
    const gameInfo = {
      gameId: 999,
      isHost: false,
      isSpectator: false
    }
    token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

    await request(app)
      .get('/home/invite?gameID=999')
      .set('Cookie', [`token=${token}`])
      .expect(404)
  })

  test('GET /home/invite should return 400 when gameID is missing', async () => {
    const gameInfo = {
      gameId: 1,
      isHost: false,
      isSpectator: false
    }
    token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

    await request(app)
      .get('/home/invite')
      .set('Cookie', [`token=${token}`])
      .expect(400)
  })
})
