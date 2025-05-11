'use strict'

const Player = require('@models/Player')
const Dictionary = require('@models/Dictionary')
const { GAME_STATES } = require('@config/gameConstants')

class Game {
  static #gameCounter = 0
  static #activeGames = []

  constructor (hostId, totalRounds = 1) {
    this.gameID = Game.#gameCounter++
    this.players = []
    this.wordPair = Dictionary.getWordPair()
    this.host = this.createPlayer(hostId)
    this.totalRounds = totalRounds // Total number of rounds for the game
    this.currentRound = 1
    this.isFinished = false
    this.roundsComplete = false
    this.state = GAME_STATES.WAITING
    this.numVotesOustanding = 0
    this.winner = null
    this.imposter = null
    this.wordLeft = this.players.length
  }

  createPlayer (playerId) {
    const role = this.#assignRole()
    const word = this.wordPair[role]
    const newPlayer = new Player(playerId, role, word)
    this.players.push(newPlayer)
    if (!this.host) {
      this.host = newPlayer
    }
    return newPlayer
  }

  #assignRole () {
    return Game.#activeGames.length === 0 ? 'imposter' : 'civilian'
  }

  reassignRoles () {
    if (this.imposter !== null) {
      this.players[this.imposter].role = 'civilian'
    }
    const timestamp = Date.now()
    this.imposter = timestamp % this.players.length
    this.players[this.imposter].role = 'imposter'
    this.players[this.imposter].word = this.wordPair[this.players[this.imposter].role]
  }

  generateUniquePlayerID () {
    let nextId = this.players.length
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].getId() === nextId) {
        nextId++
      }
    }
    return nextId
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
    game.reassignRoles()
    Game.#activeGames.push(game)
    return game
  }

  // Resets the Game
  startNewRound () {
    if (this.currentRound > this.totalRounds) {
      this._isFinished = true
      this.roundsComplete = true
      return
    }

    this.currentRound += 1
    this.players.forEach(player => {
      player.setActive(true)
      player.word = this.wordPair[player.role]
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

  get isFinished () {
    return this._isFinished
  }

  set isFinished (newValue) {
    this._isFinished = newValue
  }

  finishGame () {
    this.isFinished = true
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

  resetWordShare () {
    this.wordLeft = this.players.length
    this.players.forEach(player => {
      player.hasSharedWord = false
    })
  }
}

module.exports = Game
