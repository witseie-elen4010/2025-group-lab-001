'use strict'

const { ROLES } = require('@config/gameConstants')
const { GAME_STATES } = require('@config/gameConstants')

// Needs to be called at the end of Discussion
const setUpVoting = function (game) {
  let numVotesOutstanding = 0

  for (let i = 0; i < game.players.length; i++) {
    game.players[i].deleteAllVotes()
    game.players[i].setHasVoted(false)
    numVotesOutstanding += game.players[i].isActive() ? 1 : 0
    // console.log(game.players[i].getHasVoted())
  }

  game.setNumVotesOustanding(numVotesOutstanding)
  game.setState(GAME_STATES.VOTING)
}

const getPlayersCanVote = function (players) {
  const votingPlayers = []
  let votingPlayerCount = 0

  for (let i = 0; i < players.length; i++) {
    if (players[i].isActive()) {
      votingPlayers[votingPlayerCount] = players[i]
      votingPlayerCount += 1
    }
  }
  return votingPlayers
}

const mostVotedPlayer = function (votingPlayers) {
  let votedPlayer = null
  const maxVoted = {
    numVotes: 0,
    anotherPlayer: false
  }

  for (let i = 0; i < votingPlayers.length; i++) {
    if (votingPlayers[i].getVotesReceived() > maxVoted.numVotes) {
      votedPlayer = votingPlayers[i]
      maxVoted.numVotes = votingPlayers[i].getVotesReceived()
      maxVoted.anotherPlayer = false
    } else if (votingPlayers[i].getVotesReceived() === maxVoted.numVotes) {
      maxVoted.anotherPlayer = true
    }
  }
  return maxVoted.anotherPlayer === true ? null : votedPlayer
}

const checkGameEnd = function (game) {
  // console.log('Checking game end...')
  // console.log(game.isFinished)
  let imposterCount = 0
  let civilianCount = 0

  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i]
    if (game.players[i].isActive()) {
      player.survived() // award points

      imposterCount += game.players[i].getRole() === ROLES.IMPOSTER ? 1 : 0
      civilianCount += game.players[i].getRole() === ROLES.CIVILIAN ? 1 : 0
    }
  }

  if (game.players.length === 0) {
    game.finishGame()
    game.setState(GAME_STATES.FINISHED)
    game.setWinner(ROLES.CIVILIAN)
    console.log('Room Empty')
  }

  if (imposterCount === 0) {
    console.log('Civilians win!')
    game.setState(GAME_STATES.FINISHED)
    // if (game.currentRounds === game.totalRounds) {
    game.finishGame()
    // }
    game.setWinner(ROLES.CIVILIAN)

    // Award points to civilians for winning
    game.players.forEach(player => {
      if (player.role === ROLES.CIVILIAN) {
        if (player.isActive()) {
          player.win()
        }
      }
    })
  } else if (imposterCount >= civilianCount) {
    // console.log('Imposter wins!')
    game.setState(GAME_STATES.FINISHED)
    game.finishGame()
    game.setWinner(ROLES.IMPOSTER)

    game.players.forEach(player => {
      if (player.role === ROLES.IMPOSTER) {
        player.win()
      }
    })
  } else {
    // console.log('Game continues...')
    game.setState(GAME_STATES.SHARE_WORD)
    // console.log(game.isFinished)
  }
}

module.exports = { setUpVoting, getPlayersCanVote, mostVotedPlayer, checkGameEnd }
