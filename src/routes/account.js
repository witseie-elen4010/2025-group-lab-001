'use strict'
const express = require('express')
const path = require('path')
const account = express.Router()
const accountFunctions = require('@controllers/accountFunctions')
const querystring = require('querystring')

account.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'accounts.html'))
})

account.get('/createAccount', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'createAccount.html'))
})

account.post('/createAccount', async (req, res) => {
  const { email, username, password, confirmPassword } = req.body
  try {
    const result = await accountFunctions.createAccount(email, username, password, confirmPassword)
    if (result instanceof Error) {
      const qs = querystring.stringify({ error: result.message })
      return res.redirect(`/account/createAccount?${qs}`)
    } else {
      const token = accountFunctions.generateToken(result.username, result.playerId)
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      return res.redirect('/home')
    }
  } catch (error) {
    const qs = querystring.stringify({ error: 'Internal server error' })
    return res.redirect(`/account/createAccount?${qs}`)
  }
})

account.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'login.html'))
})

account.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const loginResult = await accountFunctions.loginAccount(email, password)
    if (loginResult instanceof Error) {
      const errorMsg = encodeURIComponent(loginResult.message)
      return res.redirect(`/account/login?error=${errorMsg}`)
    } else {
      const token = accountFunctions.generateToken(loginResult.username, loginResult.playerId)
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      return res.redirect('/home')
    }
  } catch (error) {
    return res.status(500).send('Internal server error')
  }
})

module.exports = account
