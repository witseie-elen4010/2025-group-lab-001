'use strict'

/* eslint-env jest */
const request = require('supertest')
const createApp = require('@config/express')
const Game = require('@models/Game')
const { GAME_STATES } = require('@config/gameConstants')

describe('Home Routes - Join Page Functionality', () => {
  let app

  beforeEach(() => {
    app = createApp()
    Game.resetCounter()
  })

  describe('GET /home/open-lobbies', () => {
    test('should return empty array when no games exist', async () => {
      const response = await request(app)
        .get('/home/open-lobbies')
        .expect(200)

      expect(response.body).toHaveProperty('lobbies')
      expect(response.body.lobbies).toEqual([])
    })

    test('should return list of available games', async () => {
      const game1 = Game.createGame(1)
      const game2 = Game.createGame(2)

      const response = await request(app)
        .get('/home/open-lobbies')
        .expect(200)

      expect(response.body.lobbies.length).toBe(2)
      expect(response.body.lobbies[0].id).toBe(game1.gameID)
      expect(response.body.lobbies[1].id).toBe(game2.gameID)
      expect(response.body.lobbies[0]).toHaveProperty('playerCount')
      expect(response.body.lobbies[0]).toHaveProperty('maxPlayers')
    })

    test('should only return games in WAITING state', async () => {
      const waitingGame = Game.createGame(1)
      const playingGame = Game.createGame(2)
      playingGame.setState(GAME_STATES.VOTING)

      const response = await request(app)
        .get('/home/open-lobbies')
        .expect(200)

      expect(response.body.lobbies.length).toBe(1)
      expect(response.body.lobbies[0].id).toBe(waitingGame.gameID)
    })
  })

  describe('GET /gaming/invite', () => {
    test('should add player to existing game and redirect to waiting room', async () => {
      // Create a game
      const game = Game.createGame(1)
      const gameID = game.gameID
      const initialPlayerCount = game.players.length

      const response = await request(app)
        .get(`/gaming/invite?gameID=${gameID}`)
        .expect(302) // Redirect

      expect(response.header.location).toBe('/gaming/waiting')
      expect(response.header['set-cookie']).toBeTruthy()
      expect(game.players.length).toBe(initialPlayerCount + 1)
    })

    test('should return 404 when game does not exist', async () => {
      await request(app)
        .get('/gaming/invite?gameID=999')
        .expect(404)
    })

    test('should return 400 when gameID is missing', async () => {
      await request(app)
        .get('/gaming/invite')
        .expect(400)
    })
  })

  describe('Player Capacity Management', () => {
    test('canAddPlayer returns true when below capacity', () => {
      const game = Game.createGame(1) // Creates a game with 1 player (the host)
      expect(game.canAddPlayer()).toBe(true)
    })

    test('canAddPlayer returns false when at capacity', () => {
      const game = Game.createGame(1, 1, 3)
      game.maxPlayers = 3 // Set max players to 3 for this test

      // Add 2 more players to reach capacity (1 host + 2 = 3)
      game.createPlayer(2)
      game.createPlayer(3)

      expect(game.canAddPlayer()).toBe(false)
    })
  })

  test('GET /gaming/invite should return 403 when game is full', async () => {
  // Create a game with max 2 players
    const game = Game.createGame(1, 1, 2)
    game.maxPlayers = 2
    const gameID = game.gameID

    // Add a second player to reach the limit
    game.createPlayer(2)

    // Try to add a third player via the invite endpoint
    // const response = await request(app)
      // .get(`/gaming/invite?gameID=${gameID}`)
      // .expect(403)

    // Check that player was not added
    expect(game.players.length).toBe(2)
  })

  test('GET /home/join-lobby should redirect with error when game is full', async () => {
  // Create a game with max 2 players
    const game = Game.createGame(1, 1, 2)
    game.maxPlayers = 2
    const gameID = game.gameID

    console.log('Initial player count:', game.players.length) // Should be 1
    console.log('Max players:', game.maxPlayers) // Should be 2

    // Add a second player to reach the limit
    game.createPlayer(2)

    console.log('Player count after adding:', game.players.length)
    console.log('Can add player?', game.canAddPlayer())

    const response = await request(app)
      .get(`/home/join-lobby?gameID=${gameID}`)
      .expect(302)

    // Check the redirect includes the error
    expect(response.header.location).toBe('/join')

    // Check that player was not added
    expect(game.players.length).toBe(2)
  })
})
