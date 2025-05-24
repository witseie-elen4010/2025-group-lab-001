'use strict'

/* eslint-env jest */
const request = require('supertest')
const jwt = require('jsonwebtoken')
const createApp = require('@config/express')
const Game = require('@models/Game')

describe('Guest Functionality', () => {
  let app
  let game

  beforeEach(() => {
    app = createApp()
    Game.resetCounter()
    // Create a test game
    game = Game.createGame(1, 1)
  })

  test('should allow guest to join via invite link', async () => {
    const response = await request(app)
      .get(`/home/invite?gameID=${game.gameID}`)
      .expect(302) // Expect redirect

    expect(response.header.location).toBe('/gaming/waiting')
    expect(response.header['set-cookie']).toBeTruthy()

    // Verify the token contains guest information
    const token = response.header['set-cookie'][0].split(';')[0].split('=')[1]
    const decoded = jwt.verify(token, 'your-secret-key')
    expect(decoded.gameInfo.isGuest).toBe(true)
    expect(decoded.playerId).toBeDefined()
    expect(decoded.username).toMatch(/^Guest \d+$/)
  })

  test('should assign unique player IDs to different guests', async () => {
    // First guest joins
    const response1 = await request(app)
      .get(`/home/invite?gameID=${game.gameID}`)
      .expect(302)

    const token1 = response1.header['set-cookie'][0].split(';')[0].split('=')[1]
    const decoded1 = jwt.verify(token1, 'your-secret-key')

    // Second guest joins
    const response2 = await request(app)
      .get(`/home/invite?gameID=${game.gameID}`)
      .expect(302)

    const token2 = response2.header['set-cookie'][0].split(';')[0].split('=')[1]
    const decoded2 = jwt.verify(token2, 'your-secret-key')

    // Verify different player IDs
    expect(decoded1.playerId).not.toBe(decoded2.playerId)
  })

  test('should handle invalid game ID in invite link', async () => {
    const response = await request(app)
      .get('/home/invite?gameID=999')
      .expect(404)

    expect(response.type).toBe('text/html')
  })

  test('should handle missing game ID in invite link', async () => {
    const response = await request(app)
      .get('/home/invite')
      .expect(400)

    expect(response.type).toBe('text/html')
  })

  test('should handle full game in invite link', async () => {
    // Fill up the game
    for (let i = 0; i < game.maxPlayers; i++) {
      game.createPlayer(i + 2)
    }

    const response = await request(app)
      .get(`/home/invite?gameID=${game.gameID}`)
      .expect(403)

    expect(response.type).toBe('text/html')
  })

  test('should create guest player in game when joining via invite', async () => {
    const response = await request(app)
      .get(`/home/invite?gameID=${game.gameID}`)
      .expect(302)

    const token = response.header['set-cookie'][0].split(';')[0].split('=')[1]
    const decoded = jwt.verify(token, 'your-secret-key')

    // Verify player was created in game
    const updatedGame = Game.findGame(game.gameID)
    const player = updatedGame.findPlayer(decoded.playerId)
    expect(player).toBeDefined()
    expect(player.getId()).toBe(decoded.playerId)
  })
})
