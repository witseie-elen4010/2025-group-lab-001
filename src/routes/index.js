'use strict'
const express = require('express')

const app = express()
app.use(express.urlencoded({ extended: true }))

const path = require('path')
const Game = require('@models/Game')

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
  res.redirect('/gaming/waiting')
})

router.get('/leaderboard/:gameID', (req, res) => {
  const { gameID } = req.params
  const game = Game.findGame(gameID)

  if (!game) {
    return res.status(404).send('Game not found')
  }

  // Sort players by points in descending order
  const leaderboard = game.players.sort((a, b) => b.points - a.points)

  res.render('leaderboard', { leaderboard }) // Assuming you're using a template engine like EJS or Pug
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
