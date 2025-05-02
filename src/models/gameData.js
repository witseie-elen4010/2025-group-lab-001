'use strict'

const Player = require('./Player')

let gameCounter = 0
let playerCounter = 0

const activeGames = []
const gameRoles = ['civilian', 'imposter']

const assignRole = () => {
  // First player in the first game is imposter, others are civilians
  const isFirstGame = activeGames.length === 0
  return isFirstGame ? 'imposter' : 'civilian'
}

const createGame = (playerID) => {
  const role = assignRole()
  const player = new Player(playerID, role)
  const game = {
    host: player,
    players: [player],
    gameID: gameCounter
  }
  gameCounter += 1
  return game
}

module.exports = {
  get gameCounter () { return gameCounter },
  set gameCounter (val) { gameCounter = val },
  get playerID () { return playerCounter },
  set playerID (val) { playerCounter = val },
  activeGames,
  createGame,
  gameRoles
}
