'use strict'

const Player = require('@models/Player')

class Game {
  static #gameCounter = 0
  static #activeGames = []
  static gameRoles = ['civilian', 'imposter']

  constructor (hostId, totalRounds = 5) {
    this.gameID = Game.#gameCounter++
    this.players = []
    this.host = this.#createPlayer(hostId)
    this.players.push(this.host)
    this.totalRounds = totalRounds // Total number of rounds for the game
    this.currentRound = 1
    this.isFinished = false
  }

  #createPlayer (playerId) {
    const role = this.#assignRole()
    return new Player(playerId, role)
  }

  #assignRole () {
    return Game.#activeGames.length === 0 ? 'imposter' : 'civilian'
  }

  static createGame (hostId) {
    const game = new Game(hostId)
    Game.#activeGames.push(game)
    return game
  }

  // 'Resets the Game
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
}

module.exports = Game
