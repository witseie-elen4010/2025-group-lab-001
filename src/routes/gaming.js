'use strict'
const express = require('express')
const path = require('path')
const Game = require('@models/Game')

const gaming = express.Router()

gaming.use((req, res, next) => {
  const gameID = req.cookies.gameID
  const playerID = req.cookies.playerID
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
  // Map players to their IDs for the frontend
  const playerIDs = game.players.map(player => player.getId())
  res.json({ players: playerIDs })
})

gaming.get('/playerID', (req, res) => {
  const player = req.player
  const playerID = player.getId()
  res.json({ playerID })
})

module.exports = gaming
