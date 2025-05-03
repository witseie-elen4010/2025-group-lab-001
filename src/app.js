'use strict'
require('module-alias/register')
const createApp = require('@config/express')
const { createServer } = require('node:http')
const { Server } = require('socket.io')

const app = createApp()
const server = createServer(app)
const io = new Server(server) // Initialize Socket.IO with the server instance

// Socket.IO connection
io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg)
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, (err) => {
  if (err) {
    console.log('Server start-up failed')
  } else {
    console.log(`Server is running on port ${PORT}`)
  }
})

module.exports = { server, io } // Export both server and io
