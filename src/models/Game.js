'use strict'

const Player = require('@models/Player')
const Dictionary = require('@models/Dictionary')
const { GAME_STATES } = require('@config/gameConstants')

class Game {
  static #gameCounter = 0
  static #activeGames = []
  static gameRoles = ['civilian', 'imposter']

  constructor (hostId, totalRounds = 1) {
    this.gameID = Game.#gameCounter++
    this.players = []
    this.wordPair = Dictionary.getWordPair()
    this.host = this.#createPlayer(hostId)
    this.players.push(this.host)
    this.totalRounds = totalRounds // Total number of rounds for the game
    this.currentRound = 1
    this.isFinished = false
    this.state = GAME_STATES.WAITING
    this.numVotesOustanding = 0
    this.winner = null
  }

  #createPlayer (playerId) {
    const role = this.#assignRole()
    const word = this.wordPair[role]
    return new Player(playerId, role, word)
  }

  #assignRole () {
    return Game.#activeGames.length === 0 ? 'imposter' : 'civilian'
  }

  getState () {
    return this.state
  }

  setState (newState) {
    if (!Object.values(GAME_STATES).includes(newState)) {
      throw new Error('Invalid game state')
    }
    this.state = newState
  }

  static createGame (hostId) {
    const game = new Game(hostId)
    Game.#activeGames.push(game)
    return game
  }

  // Resets the Game
  startNewRound () {
    if (this.currentRound >= this.totalRounds) {
      this.isFinished = true
    }
    this.currentRound += 1
    this.players.forEach(player => {
      player.role = this.#assignRole()
    })
  }

  isHost (playerId) {
    return this.host.getId() === playerId
  }

  static findGame (gameId) {
    return Game.#activeGames.find(game => game.gameID === Number(gameId))
  }

  findPlayer (playerId) {
    return this.players.find(player => player.getId() === Number(playerId))
  }

  getPlayers () {
    return this.players
  }

  static get activeGames () {
    return Game.#activeGames
  }

  static get isFinished () {
    return this.isFinished
  }

  static resetCounter () {
    Game.#gameCounter = 0
    Game.#activeGames.length = 0
  }

  setNumVotesOustanding (num) {
    this.numVotesOustanding = num
  }

  decreaseNumVotesOustsanding () {
    this.numVotesOustanding -= 1
  }

  getNumVotesOutstanding () {
    return this.numVotesOustanding
  }

  setWinner (winner) {
    this.winner = winner
  }

  getWinner () {
    return this.winner
  }
}

module.exports = Game
