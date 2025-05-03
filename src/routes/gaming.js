'use strict'
const express = require('express')
const path = require('path')
const Game = require('@models/Game')
const votingFunctions = require('@controllers/votingFunctions')
const { GAME_STATES } = require('@config/gameConstants')

const gaming = express.Router()

gaming.use((req, res, next) => {
  const gameID = Number(req.cookies.gameID)
  const playerID = Number(req.cookies.playerID)
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
  const playerIDs = game.players.map(player => player.getId())
  res.json({ players: playerIDs })
})

gaming.get('/wordShare', (req, res) => {
  const player = req.player
  const word = player.getWord()
  res.json({ word }) // Respond with the word as JSON
})

gaming.get('/playerID', (req, res) => {
  const player = req.player
  const playerID = player.getId()
  res.json({ playerID })
})

gaming.get('/role', (req, res) => {
  const player = req.player
  res.json({ role: player.getRole() })
})

gaming.get('/state', (req, res) => {
  const game = req.game
  res.json({ state: game.getState() })
})

gaming.post('/start', (req, res) => {
  const playerID = Number(req.cookies.playerID)
  const hostID = Number(req.cookies.hostID)

  if (playerID !== hostID) {
    return res.status(403).send('Not authorized to start game')
  }

  const game = req.game
  game.setState(GAME_STATES.SHARE_WORD)
  res.status(200).send('Game started')
})

gaming.get('/share-word', (req, res) => {
  res.json({ hello: 'hello' })
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

    const votedOutPlayer = votingFunctions.mostVotedPlayer(game.players)
    if (votedOutPlayer !== null && votedOutPlayer !== undefined) {
      votedOutPlayer.setActive(false)
    }

    if (game.getNumVotesOutstanding() === 0) {
      votingFunctions.checkGameEnd(game)
      // Multi-round mode features can be added here
    } else {
      res.sendFile(path.join(__dirname, '..', 'views', 'waitingForVotes.html'))
    }
  })

  gaming.get('/finished', (req, res) => {
    const game = req.game
    res.sendFile(path.join(__dirname, '..', 'views', 'finished.html?winner=' + game.getWinner()))
  })
})

module.exports = gaming
