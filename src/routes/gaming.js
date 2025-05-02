const express = require('express')
const path = require('path')
const gamingData = require('../models/gameData')

const gaming = express.Router()

gaming.use((req, res, next) => {
  const gameID = req.cookies.gameID
  const playerID = req.cookies.playerID
  const selectedGame = gamingData.activeGames.find((game) => Number(game.gameID) === Number(gameID))

  if (selectedGame) {
    const player = selectedGame.players.find(p => p.getId() === Number(playerID))
    if (player) {
      req.game = selectedGame
      req.player = player
      next()
    } else {
      res.redirect('/')
    }
  } else {
    res.redirect('/')
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

module.exports = gaming
