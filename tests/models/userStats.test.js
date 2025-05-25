/* eslint-env jest */
'use strict'

const request = require('supertest')
const createApp = require('@config/express')
const Game = require('@models/Game')
const accountFunctions = require('@controllers/accountFunctions')
const { Account } = accountFunctions

describe('User Stats and Leaderboard Features', () => {
  let app
  let token
  let account
  let testAccount

  beforeEach(async () => {
    app = createApp()
    Game.resetCounter()

    const uniqueEmail = `test${Date.now()}@example.com`
    const uniqueUsername = `testuser${Date.now()}`
    account = await accountFunctions.createAccount(
      uniqueEmail,
      uniqueUsername,
      'Password123',
      'Password123'
    )
    testAccount = accountFunctions.accounts.find(acc => acc.username === account.username)
    if (!testAccount) {
      testAccount = new Account(uniqueEmail, account.username, 'hashedpassword')
      testAccount.playerId = account.playerId
      accountFunctions.accounts.push(testAccount)
    }

    const gameInfo = {
      gameId: null,
      isHost: false,
      isSpectator: false
    }
    token = accountFunctions.generateToken(account.username, account.playerId, gameInfo)
  })

  describe('User Stats Feature', () => {
    test('should display user stats for user with no game history', async () => {
      // Find the account and check it has no past games
      const testAccount = accountFunctions.accounts.find(acc => acc.username === account.username)
      testAccount.pastGames = []
      testAccount.rankedPoints = 0

      const response = await request(app)
        .get('/home/stats')
        .set('Cookie', [`token=${token}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })

    test('should display user stats with game history', async () => {
      // Find the account and add game history
      const testAccount = accountFunctions.accounts.find(acc => acc.username === account.username)
      testAccount.pastGames = [
        {
          gameId: 1,
          date: new Date().toISOString(),
          totalRounds: 3,
          leaderboard: [
            { playerId: testAccount.playerId, username: testAccount.username, points: 150 },
            { playerId: 999, username: 'opponent', points: 100 }
          ],
          winner: 'civilian'
        },
        {
          gameId: 2,
          date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          totalRounds: 2,
          leaderboard: [
            { playerId: 999, username: 'opponent', points: 200 },
            { playerId: testAccount.playerId, username: testAccount.username, points: 50 }
          ],
          winner: 'imposter'
        }
      ]
      testAccount.rankedPoints = 200

      const response = await request(app)
        .get('/home/stats')
        .set('Cookie', [`token=${token}`])
        .expect(200)

      expect(response.type).toBe('text/html')
    })

    test('should handle non-existent user', async () => {
      // Create a token for a non-existent user
      const nonExistentToken = accountFunctions.generateToken('nonexistent', 9999, {})

      const response = await request(app)
        .get('/home/stats')
        .set('Cookie', [`token=${nonExistentToken}`])
        .expect(404)

      expect(response.text).toBe('User account not found')
    })

    test('should calculate total ranked points correctly after storing game results', async () => {
      // Ensure testAccount is defined
      if (!testAccount) {
        throw new Error('Test account not found')
      }
      testAccount.rankedPoints = 0

      // ew
      class MockPlayer {
        constructor (id, username) {
          this.id = id
          this.username = username
        }

        getId () {
          return this.id
        }
      }

      // Set up game with proper player object
      const game = {
        gameID: 1,
        totalRounds: 3,
        winner: 'civilian',
        players: [new MockPlayer(testAccount.playerId, testAccount.username)],
        leaderboard: {
          entries: [{
            playerId: testAccount.playerId,
            username: testAccount.username,
            points: 150
          }]
        }
      }

      // Store result and check - use the actual storeGameResult function
      accountFunctions.storeGameResult(game)
      expect(testAccount.rankedPoints).toBe(150)

      // Create a second game result
      const game2 = {
        gameID: 2,
        totalRounds: 2,
        winner: 'imposter',
        players: [new MockPlayer(testAccount.playerId, testAccount.username)],
        leaderboard: {
          entries: [{
            playerId: testAccount.playerId,
            username: testAccount.username,
            points: 50
          }]
        }
      }

      // Store another result
      accountFunctions.storeGameResult(game2)
      expect(testAccount.rankedPoints).toBe(200) // Should add up to 200 (150 + 50)
    })

    test('should limit stored game history to 5 games', async () => {
      const testAccount = accountFunctions.accounts.find(acc => acc.username === account.username)

      // Disgusting
      class MockPlayer {
        constructor (id, username) {
          this.id = id
          this.username = username
        }

        getId () {
          return this.id
        }
      }

      // Set up game with proper player object
      const game = Game.createGame(testAccount.playerId)

      game.players = [new MockPlayer(testAccount.playerId, testAccount.username)]

      // Set up leaderboard
      game.leaderboard.entries = [{
        playerId: testAccount.playerId,
        username: testAccount.username,
        points: 100
      }]

      // Store 6 game results
      for (let i = 0; i < 6; i++) {
        game.gameID = i
        accountFunctions.storeGameResult(game)
      }

      expect(testAccount.pastGames.length).toBe(5)

      // Check the most recent game (should be the last created with ID 5)
      expect(testAccount.pastGames[0].gameId).toBe(5)

      // Check the second most recent game
      expect(testAccount.pastGames[1].gameId).toBe(4)
    })
  })

  describe('Global Leaderboard Feature', () => {
    test('should return leaderboard with correct structure', async () => {
      const response = await request(app)
        .get('/home/global-leaderboard')
        .set('Cookie', [`token=${token}`])
        .expect(200)

      expect(response.body).toHaveProperty('leaderboard')
      expect(Array.isArray(response.body.leaderboard)).toBe(true)

      if (response.body.leaderboard.length > 0) {
        expect(response.body.leaderboard[0]).toHaveProperty('username')
        expect(response.body.leaderboard[0]).toHaveProperty('points')
      }
    })

    test('should sort leaderboard by points in descending order', async () => {
      // Create multiple accounts with different point values
      const accounts = []
      for (let i = 0; i < 5; i++) {
        const uniqueEmail = `test${Date.now() + i}@example.com`
        const uniqueUsername = `testuser${Date.now() + i}`
        const newAccount = await accountFunctions.createAccount(
          uniqueEmail,
          uniqueUsername,
          'Password123',
          'Password123'
        )
        accounts.push(newAccount)
      }

      // Set points for each account
      for (let i = 0; i < accounts.length; i++) {
        const foundAccount = accountFunctions.accounts.find(acc => acc.username === accounts[i].username)
        if (foundAccount) {
          foundAccount.rankedPoints = (i + 1) * 100 // 100, 200, 300, 400, 500
        }
      }

      const response = await request(app)
        .get('/home/global-leaderboard')
        .set('Cookie', [`token=${token}`])
        .expect(200)

      const points = response.body.leaderboard.map(entry => entry.points)
      for (let i = 1; i < points.length; i++) {
        expect(points[i - 1]).toBeGreaterThanOrEqual(points[i])
      }
    })

    test('should include accounts with zero points', async () => {
      const uniqueEmail = `testzero${Date.now()}@example.com`
      const uniqueUsername = `testzero${Date.now()}`

      // Create the account directly
      const zeroAccount = new accountFunctions.Account(uniqueEmail, uniqueUsername, 'Password123')
      zeroAccount.rankedPoints = 0
      accountFunctions.accounts.push(zeroAccount) // Add directly to accounts array

      const response = await request(app)
        .get('/home/global-leaderboard')
        .set('Cookie', [`token=${token}`])
        .expect(200)

      // Check if the zero points account is included
      const zeroEntry = response.body.leaderboard.find(entry => entry.username === uniqueUsername)
      expect(zeroEntry).toBeTruthy()
      expect(zeroEntry.points).toBe(0)
    })

    test('should handle server errors gracefully', async () => {
      const original = Object.getOwnPropertyDescriptor(accountFunctions, 'accounts')
      Object.defineProperty(accountFunctions, 'accounts', {
        get: function () { throw new Error('Failed to get accounts') },
        configurable: true
      })

      const response = await request(app)
        .get('/home/global-leaderboard')
        .set('Cookie', [`token=${token}`])
        .expect(500)
      console.log(response)
      // Restore the original property
      Object.defineProperty(accountFunctions, 'accounts', original)
    })
  })
})
