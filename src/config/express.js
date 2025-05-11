'use strict'

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { requestLoggerMiddleware } = require('@middleware/requestLogger')

const { createServer } = require('node:http')
const { Server } = require('socket.io')
const { socketLoggerMiddleware } = require('@middleware/requestLogger')

// Import routes
const gaming = require('@routes/gaming')
const home = require('@routes/home')
const admin = require('@routes/admin')
const account = require('@routes/account')

function createApp () {
  const app = express()

  const server = createServer(app)
  const io = new Server(server)

  // Add socket middleware for logging
  io.use(socketLoggerMiddleware)

  // Socket.IO connection
  io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      try {
      // Validate the message text
        if (!msg) {
          throw new Error('Message cannot be empty')
        }

        io.emit('chat message', msg) // Broadcast the message to all clients
      } catch (error) {
        console.error('Error handling chat message:', error.message)
        socket.emit('error', { error: error.message }) // Notify the client with a specific error message
      }
    })

    socket.on('start game', () => {
      io.emit('start game')
    })

    socket.on('start discussion', () => {
      io.emit('start discussion')
    })

    socket.on('start voting', () => {
      io.emit('start voting')
    })

    // socket.on('next round', () => {
    //   io.emit('next round')
    // })

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

  // The code commented below is for debugging purposes. It returns the request method and URL for each request made to the server.
  // app.use((req, res, next) => {
  //   console.log(req.method, req.url)
  //   next()
  // })

  // Configure routes
  app.use('/admin', admin)
  app.use('/gaming', gaming(io))

  app.use('/home', home(io))
  app.use('/', account)

  app.use((req, res, next) => {
    const error = new Error('Not Found')
    error.status = 404
    next(error)
  })

  // Global error handler
  app.use((err, req, res, next) => {
    // Log error details on server
    // console.error('Server Error:', {
    //   timestamp: new Date().toISOString(),
    //   error: err.message,
    //   stack: err.stack,
    //   url: req.url,
    //   method: req.method,
    //   statusCode: err.status || 500
    // })

    res.status(err.status || 500)
    res.sendFile(path.join(__dirname, '..', 'views', 'error.html'))
  })

  return server
}

module.exports = createApp
