'use strict'
const path = require('path')
const express = require('express')
const Game = require('@models/Game')

module.exports = (io) => {
  const home = express.Router()

  let playerCounter = 0

  home.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
  })

  home.post('/create', (req, res) => {
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

  io.emit('refresh players')

  home.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'join.html'))
  })

  home.post('/join', (req, res) => {
    const { gameID, spectate } = req.body

    if (gameID) {
      const game = Game.findGame(gameID)
      if (spectate === 'true') {
        res.cookie('spectator', spectate)
        res.redirect('/gaming/waiting')
      } else {
        if (game) {
          const currentPlayerID = playerCounter++

          game.createPlayer(currentPlayerID)

          res.cookie('playerID', currentPlayerID)
          res.cookie('gameID', gameID)
          res.cookie('spectator', spectate)
          res.redirect('/gaming/waiting')
        } else {
          res.status(403).sendFile(path.join(__dirname, '..', 'views', 'gameError.html'))
        }
      }
    } else {
      res.status(403).sendFile(path.join(__dirname, '..', 'views', 'gameError.html'))
    }
  })

  return home
}
