'use strict'
const path = require('path')
const express = require('express')
const home = express.Router()
const Game = require('@models/Game')

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

home.get('/join', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'join.html'))
})

home.post('/join', (req, res) => {
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

home.get('/open-lobbies', (req, res) => {
  try {
    const openGames = Game.getAllGames()
    const lobbies = openGames.map(game => ({
      id: game.gameID,
      playerCount: game.players.length,
      maxPlayers: game.maxPlayers
    }))

    res.json({ lobbies })
  } catch (error) {
    console.error('Error fetching open lobbies:', error)
    res.status(500).json({ error: 'Failed to fetch lobbies' })
  }
})

home.get('/join-lobby', (req, res) => {
  const gameID = Number(req.query.gameID)

  if (!gameID) {
    return res.redirect('/join')
  }

  const game = Game.findGame(gameID)
  if (!game) {
    return res.redirect('/join?error=game-not-found')
  }

  // Checking if game is full
  if (!game.canAddPlayer()) {
    return res.redirect('/join?error=game-full')
  }

  const playerID = game.generateUniquePlayerID()
  game.createPlayer(playerID)

  res.cookie('gameID', gameID)
  res.cookie('playerID', playerID)

  res.redirect('/gaming/waiting')
})

module.exports = home
