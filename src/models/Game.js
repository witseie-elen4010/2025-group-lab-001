'use strict'

const Player = require('@models/Player')
const Dictionary = require('@models/Dictionary')

class Game {
  static #gameCounter = 0
  static #activeGames = []
  static gameRoles = ['civilian', 'imposter']

  constructor (hostId) {
    this.gameID = Game.#gameCounter++
    this.players = []
    this.wordPair = Dictionary.getWordPair()
    this.host = this.#createPlayer(hostId)
    this.players.push(this.host)
  }

  #createPlayer (playerId) {
    const role = this.#assignRole()
    const word = this.wordPair[role]
    return new Player(playerId, role, word)
  }

  #assignRole () {
    return Game.#activeGames.length === 0 ? 'imposter' : 'civilian'
  }

  static createGame (hostId) {
    const game = new Game(hostId)
    Game.#activeGames.push(game)
    return game
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

  static resetCounter () {
    Game.#gameCounter = 0
    Game.#activeGames.length = 0
  }
}

module.exports = Game
