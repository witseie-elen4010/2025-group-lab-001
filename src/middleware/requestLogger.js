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
      method: eventName,
      url: `/${eventName}`,
      body: args[0]
    })
  })
  next()
}

function requestLoggerMiddleware (req, res, next) {
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
