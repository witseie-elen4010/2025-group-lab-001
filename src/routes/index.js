const express = require('express')
const path = require('path')
const gameData = require('../models/gameData')
const router = express.Router()

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
})

router.get('/create', (req, res) => {
  const newGame = gameData.createGame(gameData.playerID)
  gameData.activeGames.push(newGame)

  res.cookie('playerID', gameData.playerID)
  res.cookie('gameID', newGame.gameID)
  res.redirect('/gaming/waiting')
  gameData.playerID += 1
})

module.exports = router
