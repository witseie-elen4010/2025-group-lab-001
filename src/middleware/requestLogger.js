'use strict'

const requestLogs = []

function socketLoggerMiddleware (socket, next) {
  socket.onAny((eventName, ...args) => {
    requestLogs.push({
      type: 'websocket',
      timestamp: new Date().toISOString(),
      playerID: socket.handshake.headers.cookie?.split('; ')
        .find(row => row.startsWith('playerID='))
        ?.split('=')[1] || 'unknown',
      method: eventName, // Changed from event to method for consistency
      url: 'socket.io', // Add socket.io identifier
      body: args[0] // Take first argument as body
    })
  })
  next()
}

function requestLoggerMiddleware (req, res, next) {
  // Skip logging for static files and scripts
  if (req.url.startsWith('/scripts/') ||
      req.url.endsWith('.html') ||
      req.url.endsWith('.js') ||
      req.url.endsWith('.css')) {
    return next()
  }

  requestLogs.push({
    type: 'http',
    timestamp: new Date().toISOString(),
    playerID: req.cookies?.playerID || 'unknown',
    method: req.method,
    url: req.url,
    body: req.body
  })
  next()
}

function getRequestLogs () {
  return requestLogs
}

module.exports = { requestLoggerMiddleware, socketLoggerMiddleware, getRequestLogs }
