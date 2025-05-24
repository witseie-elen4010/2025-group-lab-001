'use strict'

const requestLogs = []

const { ACTION_MAP } = require('@config/gameConstants')
const formatters = require('./formatters')

// Helper to get formatted details
function getFormattedDetails (action, data, context = {}) {
  if (formatters[action]) {
    return formatters[action](data, context)
  }
  return JSON.stringify(data)
}

function isEmpty (obj) {
  return !obj || (typeof obj === 'object' && Object.keys(obj).length === 0)
}

function socketLoggerMiddleware (socket, next) {
  socket.onAny((eventName, ...args) => {
    const action = ACTION_MAP[eventName]
    if (!action) return // Only log mapped actions
    const data = args[0] || {}
    if (isEmpty(data)) return
    // Try to get gameID from cookies as fallback
    const cookies = Object.fromEntries(
      (socket.handshake.headers.cookie || '').split('; ').map(c => c.split('='))
    )
    const context = { gameID: cookies.gameID }
    const details = getFormattedDetails(action, data, context)
    if (!details) return // Skip if details is empty (e.g., missing vote)
    requestLogs.push({
      players: cookies.playerID || 'unknown',
      action,
      details
    })
  })
  next()
}

function requestLoggerMiddleware (req, res, next) {
  if (req.url.startsWith('/scripts/') ||
      req.url.endsWith('.html') ||
      req.url.endsWith('.js') ||
      req.url.endsWith('.css') ||
      req.url.startsWith('/login') ||
      req.url.startsWith('/createAccount')) {
    return next()
  }
  const action = ACTION_MAP[req.url]
  if (!action) return next()
  let data = req.body || {}
  // Treat non-object or array body as empty
  if (typeof data !== 'object' || Array.isArray(data)) data = {}
  const context = { gameID: req.cookies?.gameID }
  const details = getFormattedDetails(action, data, context)
  // Always log join game, otherwise skip if no data/details
  if (action !== 'join game' && (isEmpty(data) || !details)) return next()
  requestLogs.push({
    players: req.cookies?.playerID || 'unknown',
    action,
    details
  })
  next()
}

function getRequestLogs () {
  return requestLogs
}

module.exports = { requestLoggerMiddleware, getRequestLogs, socketLoggerMiddleware }
