'use strict'

const jwt = require('jsonwebtoken')
const accountFunctions = require('@controllers/accountFunctions')
// let accountFunctionsTmp
// const initialiseAccountFunctions = async function () {
//   try {
//     accountFunctionsTmp = await import('../controllers/accountFunctions.js')
//   } catch (error) {
//     console.log('Error loading accountFunctions:', error)
//   }
// }
// initialiseAccountFunctions()
// const accountFunctions = accountFunctionsTmp
// JWT secret key - should match the one in accountFunctions.js
const JWT_SECRET = 'your-secret-key'

const verifyToken = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).redirect('/login')
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    if (accountFunctions.checkValidUser(req.user.username, req.user.playerId)) {
      next()
    } else {
      return res.status(401).redirect('/login')
    }
  } catch (err) {
    return res.status(401).redirect('/login')
  }
}

module.exports = {
  verifyToken
}
