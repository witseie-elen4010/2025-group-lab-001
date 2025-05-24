'use strict'

/* eslint-env jest */
const request = require('supertest')
const createApp = require('@config/express')
const Game = require('@models/Game')
const { GAME_STATES } = require('@config/gameConstants')
const accountFunctions = require('@controllers/accountFunctions')

describe('Gaming Routes', () => {
  let app
  let io
  let testGame
  let testPlayer
  let testToken

  beforeEach(() => {
    io = {
      emit: jest.fn()
    }
    app = createApp(io)
    // Create a test account and game
    const playerId = 1 // Use a fixed ID for testing
    testGame = Game.createGame(playerId, 3)
    testPlayer = testGame.findPlayer(playerId)
    testToken = accountFunctions.generateToken('testuser', playerId, {
      gameId: testGame.gameID,
      isHost: true,
      isSpectator: false
    })
  })

  describe('GET /home/invite', () => {
    test('should create player and redirect when given valid gameID', async () => {
      await request(app)
        .get('/home/invite')
        .query({ gameID: testGame.gameID })
        .set('Cookie', [`token=${testToken}`])
        .expect(302)
        .expect('Location', '/gaming/waiting')
    })

    test('should redirect to login when not authenticated', async () => {
      await request(app)
        .get('/home/invite')
        .query({ gameID: testGame.gameID })
        .expect(302)
        .expect('Location', '/login')
    })

    test('should return 404 for non-existent gameID', async () => {
      await request(app)
        .get('/home/invite')
        .query({ gameID: 99999 })
        .set('Cookie', [`token=${testToken}`])
        .expect(404)
    })

    test('should return 400 when gameID is missing', async () => {
      await request(app)
        .get('/home/invite')
        .set('Cookie', [`token=${testToken}`])
        .expect(400)
    })
  })

  describe('Authentication Middleware', () => {
    test('should redirect player to login page when the player does not have cookies', async () => {
      await request(app)
        .get('/gaming/waiting')
        .expect(302)
        .expect('Location', '/login')
    })

    test('should serve error page with invalid game ID', async () => {
      const invalidToken = accountFunctions.generateToken('testuser', 999, {
        gameId: 999,
        isHost: false,
        isSpectator: false
      })

      await request(app)
        .get('/gaming/waiting')
        .set('Cookie', [`token=${invalidToken}`])
        .expect(403)
    })
  })

  describe('Waiting Room', () => {
    test('should access waiting room with valid cookies', async () => {
      const response = await request(app)
        .get('/gaming/waiting')
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })
  })

  describe('Player List API', () => {
    test('should get player list for valid game', async () => {
      const response = await request(app)
        .get('/gaming/players')
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(response.body).toHaveProperty('players')
      expect(Array.isArray(response.body.players)).toBe(true)
    })

    test('should deny invalid requests to player list', async () => {
      const invalidToken = accountFunctions.generateToken('testuser', 999, {
        gameId: 999,
        isHost: false,
        isSpectator: false
      })

      await request(app)
        .get('/gaming/players')
        .set('Cookie', [`token=${invalidToken}`])
        .expect(403)
    })
  })

  describe('Game State Management', () => {
    test('should allow host to start game', async () => {
      await request(app)
        .post('/gaming/start')
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(testGame.getState()).toBe(GAME_STATES.SHARE_WORD)
    })

    test('should deny non-host from starting game', async () => {
      const nonHostToken = accountFunctions.generateToken('testuser', testPlayer.getId(), {
        gameId: testGame.gameID,
        isHost: false,
        isSpectator: false
      })

      await request(app)
        .post('/gaming/start')
        .set('Cookie', [`token=${nonHostToken}`])
        .expect(403)
    })

    test('should return current game state', async () => {
      const response = await request(app)
        .get('/gaming/state')
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(response.body).toHaveProperty('state')
    })

    test('should handle game state error with invalid game ID', async () => {
      const invalidToken = accountFunctions.generateToken('testuser', 999, {
        gameId: 999,
        isHost: false,
        isSpectator: false
      })

      await request(app)
        .get('/gaming/state')
        .set('Cookie', [`token=${invalidToken}`])
        .expect(403)
    })
  })

  describe('Word Sharing API', () => {
    test('should get word for valid player', async () => {
      const response = await request(app)
        .get('/gaming/getWord')
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(response.body).toHaveProperty('word')
    })

    test('should redirect to login for unauthenticated requests', async () => {
      await request(app)
        .get('/gaming/getWord')
        .expect(302)
        .expect('Location', '/login')
    })
  })

  describe('Player ID API', () => {
    test('should get player ID for valid game', async () => {
      const response = await request(app)
        .get('/gaming/playerID')
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(response.body).toHaveProperty('playerID')
    })

    test('should redirect to login for unauthenticated requests', async () => {
      await request(app)
        .get('/gaming/playerID')
        .expect(302)
        .expect('Location', '/login')
    })
  })

  describe('Role API', () => {
    test('should get role for valid player', async () => {
      const response = await request(app)
        .get('/gaming/role')
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(response.body).toHaveProperty('role')
    })
  })

  describe('Voting System', () => {
    beforeEach(() => {
      testGame.setState(GAME_STATES.VOTING)
      // Mock socket.io emit to prevent hanging
      io.emit.mockImplementation(() => {})
    })

    test('should serve voting page', async () => {
      const response = await request(app)
        .get('/gaming/voting')
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })

    test('should handle vote submission', async () => {
      const otherPlayer = testGame.createPlayer(2)
      await request(app)
        .post('/gaming/voting')
        .set('Cookie', [`token=${testToken}`])
        .send({ vote: otherPlayer.getId() })
        .expect(302)

      expect(testPlayer.getHasVoted()).toBe(true)
    })

    test('should serve waiting for votes page', async () => {
      testPlayer.setHasVoted(true)
      const response = await request(app)
        .get('/gaming/waitingForVotes')
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })
  })

  describe('Word Share System', () => {
    test('should serve word share page', async () => {
      testGame.setState(GAME_STATES.SHARE_WORD)
      const response = await request(app)
        .get('/gaming/wordShare')
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })

    test('should handle word share page error with invalid game ID', async () => {
      const invalidToken = accountFunctions.generateToken('testuser', 999, {
        gameId: 999,
        isHost: false,
        isSpectator: false
      })

      await request(app)
        .get('/gaming/wordShare')
        .set('Cookie', [`token=${invalidToken}`])
        .expect(403)
    })
  })

  describe('Chat System', () => {
    test('should serve chat room page', async () => {
      const response = await request(app)
        .get('/gaming/chatRoom')
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })
  })

  describe('Game Flow', () => {
    test('should handle game finished state', async () => {
      testGame.setState(GAME_STATES.FINISHED)
      await request(app)
        .get('/gaming/finished')
        .set('Cookie', [`token=${testToken}`])
        .expect(302)
        .expect('Location', '/gaming/next-round')
    })

    test('should handle word share state', async () => {
      testGame.setState(GAME_STATES.SHARE_WORD)
      await request(app)
        .get('/gaming/finished')
        .set('Cookie', [`token=${testToken}`])
        .expect(302)
        .expect('Location', '/gaming/wordShare')
    })

    test('should handle next round', async () => {
      testGame.setState(GAME_STATES.FINISHED)
      await request(app)
        .get('/gaming/next-round')
        .set('Cookie', [`token=${testToken}`])
        .expect(302)
        .expect('Location', '/gaming/waiting')
    })

    test('should handle next round when game is finished', async () => {
      testGame.setState(GAME_STATES.FINISHED)
      testGame.isFinished = true
      await request(app)
        .get('/gaming/next-round')
        .set('Cookie', [`token=${testToken}`])
        .expect(302)
        .expect('Location', `/gaming/leaderboard/${testGame.gameID}`)
    })

    test('should handle non-existent game in next round', async () => {
      const invalidToken = accountFunctions.generateToken('testuser', 999, {
        gameId: 999,
        isHost: false,
        isSpectator: false
      })

      await request(app)
        .get('/gaming/next-round')
        .set('Cookie', [`token=${invalidToken}`])
        .expect(403)
    })

    test('should show leaderboard when game is finished', async () => {
      testGame.isFinished = true
      const response = await request(app)
        .get(`/gaming/leaderboard/${testGame.gameID}`)
        .set('Cookie', [`token=${testToken}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })

    test('should handle non-existent game in leaderboard', async () => {
      await request(app)
        .get('/gaming/leaderboard/999')
        .set('Cookie', [`token=${testToken}`])
        .expect(404)
    })

    test('should handle error in leaderboard', async () => {
      testGame.isFinished = true
      testGame.players = null // Force an error
      await request(app)
        .get(`/gaming/leaderboard/${testGame.gameID}`)
        .set('Cookie', [`token=${testToken}`])
        .expect(500)
    })

    test('should handle leaderboard error with invalid game ID', async () => {
      await request(app)
        .get('/gaming/leaderboard/invalid-id')
        .set('Cookie', [`token=${testToken}`])
        .expect(404)
    })
  })
})
