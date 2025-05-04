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

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, Reason: ${reason}`)
  })

  // Handle errors on the socket
  socket.on('error', (error) => {
    console.error(`Socket error on ${socket.id}:`, error.message)
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
