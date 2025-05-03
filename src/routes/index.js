'use strict'
const express = require('express')

const app = express()
app.use(express.urlencoded({ extended: true }))

const path = require('path')
const Game = require('@models/Game')
const Player = require('@models/Player')

let playerCounter = 0
const router = express.Router()

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
})

router.post('/create', (req, res) => {
  const currentPlayerID = playerCounter++
  const { rounds } = req.body
  const totalRounds = parseInt(rounds, 10)

  if (isNaN(totalRounds)) {
    console.error('Invalid number of rounds selected')
    return res.status(400).send('Invalid number of rounds selected')
  }

  const newGame = Game.createGame(currentPlayerID, totalRounds)

  res.cookie('playerID', currentPlayerID)
  res.cookie('gameID', newGame.gameID)
  res.cookie('hostID', currentPlayerID)
  res.redirect('/gaming/waiting')
})

router.get('/join', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'join.html'))
})

router.post('/join', (req, res) => {
  const gameID = req.body.gameID
  const currentPlayerID = playerCounter++

  if (gameID) {
    const game = Game.findGame(gameID)
    if (game) {
      const player = new Player(currentPlayerID)
      game.players.push(player)

      res.cookie('playerID', currentPlayerID)
      res.cookie('gameID', gameID)
      res.redirect('/gaming/waiting')
    } else {
      res.status(403).sendFile(path.join(__dirname, '..', 'views', 'gameError.html'))
    }
  } else {
    res.status(403).sendFile(path.join(__dirname, '..', 'views', 'gameError.html'))
  }
})

router.get('/leaderboard/:gameID', (req, res) => {
  const { gameID } = req.params
  const game = Game.findGame(gameID)

  if (!game) {
    return res.status(404).send('Game not found')
  }

  // Sort players by points in descending order
  const leaderboard = game.players.sort((a, b) => b.points - a.points)
  const winner = game.getWinner()

  res.render('leaderboard', { leaderboard, winner })
})

router.post('/game/next-round', (req, res) => {
  const { gameID } = req.cookies
  const game = Game.findGame(gameID)

  if (!game) {
    return res.status(404).send('Game not found')
  }

  const roundContinues = game.startNewRound()

  if (!roundContinues) {
    // Redirect to the leaderboard if the game is finished
    return res.redirect(`/leaderboard/${gameID}`)
  }

  res.redirect('/gaming/next-round') // Redirect to the next round
})

module.exports = router
