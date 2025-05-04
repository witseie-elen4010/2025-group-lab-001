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

  // if (isNaN(totalRounds)) {
  //  console.error('Invalid number of rounds selected')
  //  return res.status(400).send('Invalid number of rounds selected')
  // }

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
      game.createPlayer(currentPlayerID)

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

module.exports = router
