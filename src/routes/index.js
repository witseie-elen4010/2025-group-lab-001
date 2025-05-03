'use strict'
const express = require('express')
const path = require('path')
const Game = require('@models/Game')

let playerCounter = 0
const router = express.Router()

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
})

router.get('/chatRoom', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'chatRoom.html'))
})

router.get('/create', (req, res) => {
  const currentPlayerID = playerCounter++
  const newGame = Game.createGame(currentPlayerID)

  res.cookie('playerID', currentPlayerID)
  res.cookie('gameID', newGame.gameID)
  res.redirect('/gaming/waiting')
})

module.exports = router
