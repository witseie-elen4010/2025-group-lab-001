'use strict'
const express = require('express')
const path = require('path')
const Game = require('@models/Game')
const Player = require('@models/Player')

let playerCounter = 0
const router = express.Router()

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
})

router.get('/create', (req, res) => {
  const currentPlayerID = playerCounter++
  const newGame = Game.createGame(currentPlayerID)

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

module.exports = router
