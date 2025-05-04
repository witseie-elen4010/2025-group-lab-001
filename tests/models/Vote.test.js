/* eslint-env jest */
const { ROLES, GAME_STATES } = require('@config/gameConstants')
const { setUpVoting, getPlayersCanVote, mostVotedPlayer, checkGameEnd } = require('@controllers/votingFunctions')
const Player = require('@models/Player')
const Game = require('@models/Game')

describe('Game Voting Functions', () => {
  let game

  beforeEach(() => {
    Game.resetCounter()
    game = Game.createGame(1) // Host is player 1
    game.players.push(new Player(2, ROLES.CIVILIAN))
    game.players.push(new Player(3, ROLES.IMPOSTER))
  })

  afterEach(() => {
    Game.resetCounter()
  })

  test('setUpVoting should reset votes and set voting state', () => {
    // Set up some votes first
    game.players[0].increaseVotesReceived()
    game.players[1].increaseVotesReceived()
    game.players[0].setHasVoted(true)
    game.players[1].setHasVoted(true)

    setUpVoting(game)

    expect(game.getNumVotesOutstanding()).toBe(3) // All 3 players active by default
    expect(game.getState()).toBe(GAME_STATES.VOTING)
    game.players.forEach(player => {
      expect(player.getVotesReceived()).toBe(0)
      expect(player.getHasVoted()).toBe(false)
    })
  })

  test('getPlayersCanVote should return only active players', () => {
    game.players[2].setActive(false) // Deactivate player 3

    const result = getPlayersCanVote(game.players)

    expect(result.length).toBe(2)
    expect(result[0].getId()).toBe(1)
    expect(result[1].getId()).toBe(2)
  })

  test('mostVotedPlayer should return null for tie', () => {
    game.players[0].increaseVotesReceived() // Player 1: 1 vote
    game.players[1].increaseVotesReceived() // Player 2: 1 vote

    const result = mostVotedPlayer(game.players)

    expect(result).toBeNull()
  })

  test('checkGameEnd should continue game when no winner', () => {
    // Default setup: 2 civilians, 1 imposter
    checkGameEnd(game)

    expect(game.getState()).toBe(GAME_STATES.SHARE_WORD)
    expect(game.getWinner()).toBeNull()
  })
})
