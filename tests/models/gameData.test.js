/* eslint-env jest */
const gameData = require('../../src/models/gameData')

describe('Game Data Management', () => {
  beforeEach(() => {
    gameData.gameCounter = 0
    gameData.playerID = 0
    gameData.activeGames.length = 0
  })

  test('should create new game with host player', () => {
    const game = gameData.createGame(1)
    expect(game.gameID).toBe(0)
    expect(game.host.getId()).toBe(1)
    expect(game.players.length).toBe(1)
  })

  test('first player should be imposter', () => {
    const game = gameData.createGame(1)
    expect(game.host.getRole()).toBe('imposter')
  })
})
