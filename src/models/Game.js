'use strict'

const Player = require('@models/Player')
const Dictionary = require('@models/Dictionary')
const Leaderboard = require('./leaderboard')
const { GAME_STATES } = require('@config/gameConstants')

class Game {
  static #gameCounter = 0
  static #activeGames = []

  constructor (hostId, totalRounds = 1, dictionaryType = 'word', maxPlayers = 5) {
    this.gameID = Game.#gameCounter++
    this.players = []
    this.wordPair = Dictionary.getWordPair(dictionaryType)
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
    this.max = maxPlayers

    this.leaderboard = new Leaderboard(this.players)
  }

  static getAllGames () {
    return Game.#activeGames.filter(game =>
      game.state === GAME_STATES.WAITING &&
    game.players.length <= game.max)
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
    this.imposter = Math.floor(Math.random() * this.players.length)
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

  static createGame (hostId, totalRounds = 1, dictionaryType = 'word', maxPlayers = 5) {
    const game = new Game(hostId, totalRounds, dictionaryType, maxPlayers)
    game.reassignRoles()
    Game.#activeGames.push(game)
    return game
  }

  canAddPlayer () {
    return this.players.length < this.max
  }

  // Resets the Game
  startNewRound () {
    if (this.currentRound >= this.totalRounds) {
      this.roundsComplete = true
      return
    }

    this.currentRound += 1
    this.players.forEach(player => {
      player.setActive(true)
      player.word = this.wordPair[player.role]
      this.reassignRoles()
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

  win (player) {
    this.leaderboard.incrementPoints(player, 100)
  }

  survived (player) {
    this.leaderboard.incrementPoints(player, 10 * player.votesReceived)
  }

  finishGame () {
    this.leaderboard.getSorted()
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
