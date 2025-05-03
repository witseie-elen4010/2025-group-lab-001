'use strict'
const express = require('express')
const path = require('path')
const Game = require('@models/Game')
// const { io } = require('@src/app') // Import the shared io instance

let playerCounter = 0
const router = express.Router()

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
})

router.get('/wordShare', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'wordShare.html'))
})

router.get('/create', (req, res) => {
  const currentPlayerID = playerCounter++
  const newGame = Game.createGame(currentPlayerID)

  res.cookie('playerID', currentPlayerID)
  res.cookie('gameID', newGame.gameID)
  res.redirect('/gaming/waiting')
})

module.exports = router
