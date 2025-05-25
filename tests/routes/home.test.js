/* eslint-env jest */
'use strict'

const request = require('supertest')
const createApp = require('@config/express')
const Game = require('@models/Game')
const accountFunctions = require('@controllers/accountFunctions')
const express = require('express')

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
      for (let i = 0; i < game.max - 1; i++) {
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
        .send({ gameID: game.gameID, spectate: 'false' })
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

  describe('GET /home/stats', () => {
    test('should serve user stats page for authenticated user', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      // Add some past games to the test account
      const testAccount = accountFunctions.accounts.find(acc => acc.playerId === 1)
      testAccount.pastGames = [
        {
          gameId: 1,
          date: new Date().toISOString(),
          totalRounds: 3,
          leaderboard: [{ playerId: 1, username: 'testUser', points: 100 }],
          winner: 'civilian'
        }
      ]
      testAccount.rankedPoints = 100

      const response = await request(app)
        .get('/home/stats')
        .set('Cookie', [`token=${token}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })

    test('should return 404 when user account not found', async () => {
      // Create a token with a non-existent player ID
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }

      // Temporarily mock the accounts.find method to return undefined
      const originalFind = accountFunctions.accounts.find
      accountFunctions.accounts.find = jest.fn().mockReturnValue(undefined)

      token = accountFunctions.generateToken('nonexistent', 999, gameInfo)

      const response = await request(app)
        .get('/home/stats')
        .set('Cookie', [`token=${token}`])
        .expect(404)

      expect(response.text).toBe('User account not found')

      // Restore the original find method
      accountFunctions.accounts.find = originalFind
    })

    test('should handle server error gracefully', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      // Mock the render function on the route handler
      const originalRender = express.response.render
      express.response.render = jest.fn().mockImplementation(function () {
        throw new Error('Rendering error')
      })

      const response = await request(app)
        .get('/home/stats')
        .set('Cookie', [`token=${token}`])
        .expect(500)

      expect(response.text).toMatch(/Error displaying user stats/)

      // Restore original render function
      express.response.render = originalRender
    })
  })

  describe('GET /home/global-leaderboard', () => {
    test('should return leaderboard data', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      // Add ranked points to accounts
      accountFunctions.accounts[0].rankedPoints = 300
      if (accountFunctions.accounts.length > 1) {
        accountFunctions.accounts[1].rankedPoints = 200
      } else {
        // Create another account with ranked points
        const newAccount = await accountFunctions.createAccount(
          'test2@example.com',
          'testuser2',
          'Password123',
          'Password123'
        )
        newAccount.points = 0
        const accountObj = accountFunctions.accounts.find(a => a.username === 'testuser2')
        accountObj.rankedPoints = 200
      }

      const response = await request(app)
        .get('/home/global-leaderboard')
        .set('Cookie', [`token=${token}`])
        .expect(200)

      expect(response.body).toHaveProperty('leaderboard')
      expect(response.body.leaderboard.length).toBeGreaterThanOrEqual(2)
      expect(response.body.leaderboard[0]).toHaveProperty('points')
      expect(response.body.leaderboard[0]).toHaveProperty('username')

      // Verify descending order by points
      expect(response.body.leaderboard[0].points).toBeGreaterThanOrEqual(response.body.leaderboard[1].points)
    })

    test('should handle server error gracefully', async () => {
      const gameInfo = {
        gameId: null,
        isHost: false,
        isSpectator: false
      }
      token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)

      // Mock accounts accessor to throw an error
      const original = Object.getOwnPropertyDescriptor(accountFunctions, 'accounts')

      Object.defineProperty(accountFunctions, 'accounts', {
        get: function () { throw new Error('Failed to get accounts') },
        configurable: true
      })

      const response = await request(app)
        .get('/home/global-leaderboard')
        .set('Cookie', [`token=${token}`])
        .expect(500)

      expect(response.body).toHaveProperty('error')

      // Restore the original property
      Object.defineProperty(accountFunctions, 'accounts', original)
    })
  })
})
