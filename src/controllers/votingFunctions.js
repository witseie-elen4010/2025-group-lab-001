'using strict'

const { ROLES } = require('@config/gameConstants')
const { GAME_STATES } = require('@config/gameConstants')

// Needs to be called at the end of Discussion
const setUpVoting = function (game) {
  let numVotesOutstanding = 0

  for (let i = 0; i < game.players.length(); i++) {
    game.players[i].deleteAllVotes()
    game.players[i].setHasVotes(false)
    numVotesOutstanding += game.players[i].isActive ? 1 : 0
  }

  game.setNumVotesOutstanding(numVotesOutstanding)
  // Send the necessary files (HTML, CSS, JavaScript) to client

  setTimeout(checkGameEnd(game.players, game.gameState), 30000)
  game.gameState.setState(GAME_STATES.VOTING)
}

const getPlayersCanVote = function (players) {
  const votingPlayers = []
  let votingPlayerCount = 0

  for (let i = 0; i < players.length(); i++) {
    if (players[i].isActive()) {
      votingPlayers[votingPlayerCount] = players[i]
      votingPlayerCount += 1
    }
  }
  return votingPlayers
}

const mostVotedPlayer = function (votingPlayers) {
  const maxVoted = {
    id: null,
    numVotes: 0,
    anotherPlayer: false
  }

  for (let i = 0; i < votingPlayers.length(); i++) {
    if (votingPlayers[i].getVotesReceived() > maxVoted.numVotes) {
      maxVoted.id = votingPlayers[i].getId()
      maxVoted.numVotes = votingPlayers[i].getVotesReceived()
      maxVoted.anotherPlayer = false
    } else if (votingPlayers[i].getVotesReceived() === maxVoted) {
      maxVoted.anotherPlayer = true
    }
  }
  return maxVoted.anotherPlayer === true ? null : maxVoted.id
}

// Fix this
const checkGameEnd = function (game) {
  let imposterCount = 0
  let civilianCount = 0

  for (let i = 0; i < game.players.length(); i++) {
    if (game.players[i].isActive()) {
      imposterCount += game.players[i].role === ROLES.IMPOSTER ? 1 : 0
      civilianCount += game.players[i].role === ROLES.CIVILIAN ? 1 : 0
    }
  }
  if (imposterCount === 0) {
    game.setState(GAME_STATES.FINISHED)
    game.winner = ROLES.CIVILIAN
  } else if (imposterCount === civilianCount) {
    game.setState(GAME_STATES.FINISHED)
    game.winner = ROLES.IMPOSTER
  } else {
    game.setState(GAME_STATES.SHARE_WORD)
  }
}

module.exports = { setUpVoting, getPlayersCanVote, mostVotedPlayer, checkGameEnd }
