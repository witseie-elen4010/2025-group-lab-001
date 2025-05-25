'use strict'

const { ACTION_MAP } = require('@config/gameConstants')
const formatters = require('./formatters')
const { sql, getPool } = require('@config/db')
const jwt = require('jsonwebtoken')

async function ensureTableExists () {
  try {
    const pool = await getPool()
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RequestLogs')
      BEGIN
        CREATE TABLE RequestLogs (
          LogID INT IDENTITY(1,1) PRIMARY KEY,
          Players NVARCHAR(100),
          Action NVARCHAR(100),
          Details NVARCHAR(MAX),
          Timestamp DATETIME2 DEFAULT GETUTCDATE()
        )
      END
    `)
  } catch (err) {
    console.error('Failed to ensure logs table exists:', err)
  }
}

// Call this when the module loads
ensureTableExists()

async function logToDatabase (logEntry) {
  try {
    const pool = await getPool()
    await pool.request()
      .input('players', sql.NVarChar(100), String(logEntry.players)) // Convert to string
      .input('action', sql.NVarChar(100), logEntry.action)
      .input('details', sql.NVarChar(sql.MAX), logEntry.details)
      .input('timestamp', sql.DateTime2, new Date(logEntry.timestamp))
      .query(`
        INSERT INTO RequestLogs (Players, Action, Details, Timestamp)
        VALUES (@players, @action, @details, @timestamp)
      `)
  } catch (err) {
    console.error('Error logging to database:', err)
  }
}

function getFormattedDetails (action, data, context = {}) {
  if (formatters[action]) {
    return formatters[action](data, context)
  }
  return JSON.stringify(data)
}

function isEmpty (obj) {
  return !obj || (typeof obj === 'object' && Object.keys(obj).length === 0)
}

const JWT_SECRET = 'your-secret-key'

function socketLoggerMiddleware (socket, next) {
  socket.onAny((eventName, ...args) => {
    const action = ACTION_MAP[eventName]
    if (!action) {
      return
    }

    const data = args[0] || {}
    if (isEmpty(data)) {
      return
    }

    const cookies = Object.fromEntries(
      (socket.handshake.headers.cookie || '').split('; ').map(c => c.split('='))
    )
    const token = cookies.token
    let playerId = 'unknown'
    let gameId = 'unknown'

    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET)
        playerId = payload.playerId || 'unknown'
        gameId = payload.gameInfo?.gameId || 'unknown'
      } catch (err) {
        return
      }
    }

    const context = { gameID: gameId }
    const details = getFormattedDetails(action, data, context)
    if (!details) return

    const logEntry = {
      players: playerId,
      action,
      details,
      timestamp: new Date().toISOString()
    }

    logToDatabase(logEntry)
  })
  next()
}

async function requestLoggerMiddleware (req, res, next) {
  if (req.url.startsWith('/scripts/') ||
      req.url.endsWith('.html') ||
      req.url.endsWith('.js') ||
      req.url.endsWith('.css') ||
      req.url.startsWith('/login') ||
      req.url.startsWith('/createAccount')) {
    return next()
  }

  const action = ACTION_MAP[req.url]
  if (!action) {
    return next()
  }

  let data = req.body || {}
  if (typeof data !== 'object' || Array.isArray(data)) data = {}

  const token = req.cookies.token
  let playerId = 'unknown'
  let gameId = 'unknown'

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET)
      playerId = payload.playerId || 'unknown'
      gameId = payload.gameInfo?.gameId || 'unknown'
    } catch (err) {
      return next()
    }
  }

  const context = { gameID: gameId }
  const details = getFormattedDetails(action, data, context)

  if (action !== 'join game' && (isEmpty(data) || !details)) return next()

  const logEntry = {
    players: playerId,
    action,
    details,
    timestamp: new Date().toISOString()
  }

  await logToDatabase(logEntry)
  next()
}

async function getRequestLogs () {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .query('SELECT * FROM RequestLogs ORDER BY Timestamp DESC')
    return result.recordset
  } catch (err) {
    console.error('Error fetching logs:', err)
    return []
  }
}

module.exports = { requestLoggerMiddleware, getRequestLogs, socketLoggerMiddleware }
