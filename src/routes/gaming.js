const express = require('express')
const path = require('path')
const gamingData = require('../models/gameData')

const gaming = express.Router()

gaming.use((req, res, next) => {
  const gameID = req.cookies.gameID
  const selectedGame = gamingData.activeGames.find((game) => Number(game.gameID) === Number(gameID))
  if (selectedGame) {
    req.game = selectedGame
    next()
  } else {
    res.redirect('/')
  }
})

gaming.get('/waiting', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'wait.html'))
})

gaming.get('/players', (req, res) => {
  const game = req.game
  res.json({ players: game.players })
})

module.exports = gaming
