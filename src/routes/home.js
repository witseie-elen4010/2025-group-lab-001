'use strict'
const path = require('path')
const express = require('express')
const Game = require('@models/Game')
const { verifyToken } = require('@middleware/auth')
const accountFunctions = require('@controllers/accountFunctions')

module.exports = (io) => {
  const home = express.Router()

  // Apply JWT verification to all home routes
  home.use(verifyToken)

  home.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'))
  })

  home.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'createGame.html'))
  })

  home.post('/createGame', (req, res) => {
    const { totalRounds } = req.body
    const currentPlayerID = req.user.playerId

    try {
      const newGame = Game.createGame(currentPlayerID, totalRounds)

      // Update JWT with game info
      const gameInfo = {
        gameId: newGame.gameID,
        isHost: true,
        isSpectator: false
      }
      const newToken = accountFunctions.generateToken(req.user.username, currentPlayerID, gameInfo)
      res.cookie('token', newToken, { secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })

      res.redirect('/gaming/waiting')
    } catch (error) {
      res.status(500).send('Error creating game')
    }
  })

  home.post('/joinGame', (req, res) => {
    const { gameID } = req.body
    const { spectate } = req.body
    try {
      const game = Game.findGame(Number(gameID))

      if (!game) {
        return res.status(404).send('Game not found')
      }

      if (!game.canAddPlayer()) {
        return res.status(403).send('Game is full')
      }

      const currentPlayerID = req.user.playerId
      if (!spectate) {
        game.createPlayer(currentPlayerID)
      }
      // Update JWT with game info
      const gameInfo = {
        gameId: gameID,
        isHost: false,
        isSpectator: Boolean(spectate)
      }
      const newToken = accountFunctions.generateToken(req.user.username, currentPlayerID, gameInfo)
      res.cookie('token', newToken, { secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })

      res.redirect('/gaming/waiting')
    } catch (error) {
      res.status(500).send('Error joining game')
    }
  })

  home.get('/spectate', (req, res) => {
    const { gameID } = req.query

    try {
      const game = Game.findGame(Number(gameID))

      if (!game) {
        return res.status(404).send('Game not found')
      }

      const gameInfo = {
        gameId: gameID,
        isHost: false,
        isSpectator: true
      }
      const newToken = accountFunctions.generateToken(req.user.username, req.user.playerId, gameInfo)
      res.cookie('token', newToken, { secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })

      res.redirect('/gaming/waiting')
    } catch (error) {
      res.status(500).send('Error spectating game')
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
      res.status(500).json({ error: 'Failed to fetch lobbies' })
    }
  })

  home.get('/join-lobby', (req, res) => {
    const gameID = Number(req.query.gameID)
    // check valid gameID
    if (!gameID) {
      return res.redirect('/join')
    }
    const game = Game.findGame(gameID)
    if (!game) {
      return res.redirect('/join?error=game-not-found')
    }
    // Checking if game is full
    if (!game.canAddPlayer()) {
      return res.redirect(`/join?error=${encodeURIComponent('game-full')}`)
    }

    const playerID = game.generateUniquePlayerID()
    game.createPlayer(playerID)

    res.cookie('gameID', gameID)
    res.cookie('playerID', playerID)

    res.redirect('/gaming/waiting')
  })

  io.emit('refresh players')

  home.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'join.html'))
  })

  home.get('/invite', (req, res) => {
    const gameID = req.query.gameID

    if (gameID === undefined || isNaN(gameID)) {
      return res.status(400).sendFile(path.join(__dirname, '..', 'views', 'gameError.html'))
    }

    const game = Game.findGame(gameID)
    if (game) {
      if (!game.canAddPlayer()) {
        return res.status(403).sendFile(path.join(__dirname, '..', 'views', 'gameFullError.html'))
      }

      game.createPlayer(req.user.playerId)

      const gameInfo = {
        gameId: gameID,
        isHost: false,
        isSpectator: false
      }
      const newToken = accountFunctions.generateToken(req.user.username, req.user.playerId, gameInfo)
      res.cookie('token', newToken, { secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })
      res.redirect('/gaming/waiting')
    } else {
      res.status(404).sendFile(path.join(__dirname, '..', 'views', 'gameError.html'))
    }
  })

  return home
}
