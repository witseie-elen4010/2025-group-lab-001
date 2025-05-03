/* eslint-env jest */
const Game = require('@models/Game')

describe('Game Management', () => {
  beforeEach(() => {
    Game.resetCounter()
  })

  describe('Game Creation', () => {
    test('should create new game with host player', () => {
      const game = Game.createGame(1)
      expect(game.gameID).toBe(0)
      expect(game.host.getId()).toBe(1)
      expect(game.players.length).toBe(1)
    })

    test('first player should be imposter', () => {
      const game = Game.createGame(1)
      expect(game.host.getRole()).toBe('imposter')
    })

    test('subsequent players should be civilians', () => {
      Game.createGame(1) // First game with imposter
      const game2 = Game.createGame(2)
      expect(game2.host.getRole()).toBe('civilian')
    })

    test('should assign word to player based on role', () => {
      const game = Game.createGame(1)
      expect(game.host.getWord()).toBe(game.wordPair.imposter)
    })
  })

  describe('Game Counter Management', () => {
    test('should increment game counter correctly', () => {
      const game1 = Game.createGame(1)
      const game2 = Game.createGame(2)
      expect(game1.gameID).toBe(0)
      expect(game2.gameID).toBe(1)
    })
  })
})
