'use strict'
const express = require('express')
const path = require('path')
const Game = require('@models/Game')
const votingFunctions = require('../controllers/votingFunctions')
const { ROLES } = require('../config/gameConstants')
const { GAME_STATES } = require('../config/gameConstants')

const gaming = express.Router()

gaming.use((req, res, next) => {
  const gameID = req.cookies.gameID
  const playerID = req.cookies.playerID
  const selectedGame = Game.findGame(gameID)

  if (selectedGame) {
    const player = selectedGame.findPlayer(playerID)
    if (player) {
      req.game = selectedGame
      req.player = player
      next()
    } else {
      res.status(403).sendFile(path.join(__dirname, '..', 'views', 'gameError.html'))
    }
  } else {
    res.status(403).sendFile(path.join(__dirname, '..', 'views', 'gameError.html'))
  }
})

gaming.get('/waiting', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'wait.html'))
})

gaming.get('/players', (req, res) => {
  const game = req.game
  // Map players to their IDs for the frontend
  const playerIDs = game.players.map(player => player.getId())
  res.json({ players: playerIDs })
})

gaming.get('/voting', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'vote.html'))
})

gaming.post('/voting', (req, res) => {
  const player = req.player
  const game = req.game
  let vote = null
  let votedPlayer = null

  if (game.gamestates === GAME_STATES.VOTING) {
    if (player.getHasVoted() === false && player.isActive()) {
      vote = req.body.vote
      if (vote !== null && vote !== undefined) {
        votedPlayer = game.findPlayer(vote)
        if (votedPlayer !== null && votedPlayer !== undefined) {
          votedPlayer.increaseVotesReceived()
          player.setHasVoted(true)
          game.decreaseNumVotesOutstanding()
        }
      }
    }
  }

  if (game.getNumVotesOutstanding() === 0) {
    votingFunctions.checkGameEnd(game)
    // Multi-round mode features can be added here
  } else {
    res.sendFile(path.join(__dirname, '..', 'views', 'waitingForVotes.html'))
  }
})

module.exports = gaming
