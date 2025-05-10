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

      // Redirect back to the form with error message as a query param
      const qs = querystring.stringify({ error: result.message })
      return res.redirect(`/createAccount?${qs}`)
    } else {
      console.log('Account created successfully')
      //   res.cookie('username', username)
      return res.redirect('/home')
    }
  } catch (error) {
    console.error('Error creating account:', error)
    const qs = querystring.stringify({ error: 'Internal server error' })
    return res.redirect(`/createAccount?${qs}`)
  }
})

module.exports = account
