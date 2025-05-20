'use strict'

const jwt = require('jsonwebtoken')

// JWT secret key - should match the one in accountFunctions.js
const JWT_SECRET = 'your-secret-key'

const verifyToken = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).redirect('/login')
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded // This will contain { username, playerId }
    next()
  } catch (err) {
    return res.status(401).redirect('/login')
  }
}

module.exports = {
  verifyToken
}
