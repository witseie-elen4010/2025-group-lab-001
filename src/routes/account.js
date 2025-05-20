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
      console.error(result.message)
      const qs = querystring.stringify({ error: result.message })
      return res.redirect(`/createAccount?${qs}`)
    } else {
      console.log('Account created successfully')
      const token = accountFunctions.generateToken(result.username, result.playerId)
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })
      return res.redirect('/home')
    }
  } catch (error) {
    console.error('Error creating account:', error)
    const qs = querystring.stringify({ error: 'Internal server error' })
    return res.redirect(`/createAccount?${qs}`)
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
      return res.redirect(`/login?error=${errorMsg}`)
    } else {
      const token = accountFunctions.generateToken(loginResult.username, loginResult.playerId)
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })
      return res.redirect('/home')
    }
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).send('Internal server error')
  }
})

module.exports = account
