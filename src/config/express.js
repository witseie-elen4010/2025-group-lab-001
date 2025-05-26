'use strict'

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { requestLoggerMiddleware } = require('@middleware/requestLogger')
const Game = require('@models/Game')

const { createServer } = require('node:http')
const { Server } = require('socket.io')
const { socketLoggerMiddleware } = require('@middleware/requestLogger')

// Import routes
const gaming = require('@routes/gaming')
const home = require('@routes/home')
const admin = require('@routes/admin')
const account = require('@routes/account')

// Game timing
const proportions = { description: 25, discussion: 75 }

function createApp () {
  const app = express()
  const server = createServer(app)
  const io = new Server(server)

  // Add socket middleware for logging
  io.use(socketLoggerMiddleware)

  const activeTimers = {}

  // Socket.IO connection
  io.on('connection', (socket) => {
    socket.on('chat message', (msg, gameID) => {
      try {
        // Validate the message text
        if (!msg) {
          throw new Error('Message cannot be empty')
        }

        io.emit('chat message', msg, gameID) // Broadcast the message to all clients
      } catch (error) {
        console.error('Error handling chat message:', error.message)
        socket.emit('error', { error: error.message }) // Notify the client with a specific error message
      }
    })

    socket.on('start game', (gameID) => {
      io.emit('start game', gameID)
    })

    socket.on('share description', (data) => {
      // Validate game exists
      const game = Game.findGame(data.gameId)
      if (!game) {
        socket.emit('error', { error: 'Game not found' })
        return
      }

      // Broadcast to all players in the game
      io.emit('share description', data.gameId)

      // Start description phase timer if timeLimit is set
      const timeLimit = game.getTimeLimit()
      if (timeLimit !== 0) {
        let timeLeft = timeLimit * (proportions.description / 100) * 60
        let timeUpdate = ''

        activeTimers[data.gameId] = setInterval(() => {
          timeUpdate = `Time left: ${timeLeft}s`
          io.emit('time update', timeUpdate, data.gameId)
          timeLeft--

          if (timeLeft < 0) {
            clearInterval(activeTimers[data.gameId])
            delete activeTimers[data.gameId]
            io.emit('start discussion', data.gameId)
          }
        }, 1000)
      }
    })

    socket.on('start discussion', (gameID) => {
      io.emit('start discussion', gameID)

      const timeLimit = Game.findGame(gameID).getTimeLimit()
      if (timeLimit !== 0) {
        let timeLeft = timeLimit * (proportions.discussion / 100) * 60
        let timeUpdate = ''

        activeTimers[gameID] = setInterval(() => {
          timeUpdate = `Time left: ${timeLeft}s`
          io.emit('time update', timeUpdate, gameID)
          timeLeft--

          if (timeLeft < 0) {
            clearInterval(activeTimers[gameID])
            delete activeTimers[gameID]
            io.emit('start voting', gameID)
          }
        }, 1000)
      }
    })

    socket.on('start voting', (gameID) => {
      io.emit('start voting', gameID)
    })

    socket.on('stop timer', (gameID) => {
      if (activeTimers[gameID]) {
        clearInterval(activeTimers[gameID])
        delete activeTimers[gameID]
      }
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.id}, Reason: ${reason}`)
    })

    // Handle errors on the socket
    socket.on('error', (error) => {
      console.error(`Socket error on ${socket.id}:`, error.message)
    })
  })

  app.set('view engine', 'ejs')
  app.set('views', path.join(__dirname, '..', 'views'))

  // Configure middleware
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(requestLoggerMiddleware) // Add the logger middleware

  app.use('/scripts', express.static(path.join(__dirname, '..', 'public', 'js')))
  app.use('/fonts', express.static(path.join(__dirname, '..', 'public', 'fonts')))
  app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets')))

  // Configure routes
  app.use('/admin', admin)
  app.use('/gaming', gaming(io, Game))
  app.use('/home', home(io, Game))
  app.use('/', account)

  app.use((req, res, next) => {
    const error = new Error('Not Found')
    error.status = 404
    next(error)
  })

  // Global error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.sendFile(path.join(__dirname, '..', 'views', 'error.html'))
  })

  return server
}

module.exports = createApp
