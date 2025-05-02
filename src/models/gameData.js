let gameCounter = 0
let playerID = 0

const activeGames = []

const createGame = (PID) => {
  const game = {
    host: PID,
    players: [PID],
    gameID: gameCounter
  }
  gameCounter += 1
  return game
}

module.exports = {
  get gameCounter () { return gameCounter },
  set gameCounter (val) { gameCounter = val },
  get playerID () { return playerID },
  set playerID (val) { playerID = val },
  activeGames,
  createGame
}
