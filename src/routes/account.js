'use strict'
const express = require('express')
const path = require('path')
const account = express.Router()
const accountFunctions = require('@controllers/accountFunctions')
const querystring = require('querystring')
const { verifyToken } = require('@middleware/auth')
// const { verifyToken } = require('@middleware/auth')

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
      return res.redirect(`/createAccount?${qs}`)
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
    return res.redirect(`createAccount?${qs}`)
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

account.get('/forgotPassword', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'forgotPassword.html'))
})

account.post('/forgotPassword', async (req, res) => {
  const { email } = req.body
  try {
    const result = await accountFunctions.checkIfUser(email)
    if (result instanceof Error) {
      const errorMsg = encodeURIComponent(result.message)
      return res.redirect(`/forgotPassword?error=${errorMsg}`)
    } else {
      try {
        const otpSent = await accountFunctions.sendOTP(email)
        if (otpSent instanceof Error) {
          const errorMsg = encodeURIComponent(otpSent.message)
          return res.redirect(`/forgotPassword?error=${errorMsg}`)
        } else {
          const username = await accountFunctions.getUsername(email)
          if (username instanceof Error) {
            const errorMsg = encodeURIComponent(username.message)
            return res.redirect(`/forgotPassword?error=${errorMsg}`)
          } else {
            res.cookie('username', username)
            return res.redirect('/verifyOTP')
          }
        }
      } catch (error) {
        console.error('Error sending OTP:', error)
        return res.status(500).send('Internal server error')
      }
    }
  } catch (error) {
    console.error('Error sending OTP', error)
    return res.status(500).send('Internal server error')
  }
})

account.get('/verifyOTP', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'verifyOTP.html'))
})

account.post('/verifyOTP', async (req, res) => {
  const { otp } = req.body
  const username = req.cookies.username
  try {
    const result = await accountFunctions.verifyOTP(username, otp)
    if (result instanceof Error) {
      const errorMsg = encodeURIComponent(result.message)
      return res.redirect(`/verifyOTP?error=${errorMsg}`)
    } else {
      // OTP verified successfully, redirect to reset password page
      return res.redirect('/resetPassword')
    }
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return res.status(500).send('Internal server error')
  }
})

account.get('/resendOTP', async (req, res) => {
  const username = req.cookies.username
  try {
    const email = await accountFunctions.getEmail(username)
    if (email instanceof Error) {
      const errorMsg = encodeURIComponent(email.message)
      return res.redirect(`/verifyOTP?error=${errorMsg}`)
    } else {
      const otpSent = await accountFunctions.sendOTP(email)
      if (otpSent instanceof Error) {
        const errorMsg = encodeURIComponent(otpSent.message)
        return res.redirect(`/verifyOTP?error=${errorMsg}`)
      } else {
        return res.redirect('/verifyOTP')
      }
    }
  } catch (error) {
    console.error('Error resending OTP:', error)
    return res.status(500).send('Internal server error')
  }
})

account.get('/resetPassword', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'resetPassword.html'))
})

account.post('/resetPassword', async (req, res) => {
  const { password, confirmPassword } = req.body
  const username = req.cookies.username
  try {
    const result = await accountFunctions.resetPassword(username, password, confirmPassword)
    if (result instanceof Error) {
      const errorMsg = encodeURIComponent(result.message)
      return res.redirect(`/resetPassword?error=${errorMsg}`)
    } else {
      // Password reset successfully
      res.clearCookie('username')
      return res.redirect('/passwordReset')
    }
  } catch (error) {
    console.error('Error resetting password:', error)
    return res.status(500).send('Internal server error')
  }
})

account.get('/passwordReset', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'passwordReset.html'))
})

account.get('/stats', verifyToken, (req, res) => {
  console.log('You have redirected successfully')
  const playerId = req.user.playerId

  const account = accountFunctions.accounts.find(acc => acc.playerId === playerId)

  if (!account) {
    return res.status(404).send('User account not found')
  }
  if (!account.pastGames) account.pastGames = []
  try {
    return res.render('userStats', {
      username: account.username,
      rankedPoints: account.rankedPoints,
      pastGames: account.pastGames,
      user: req.user
    })
  } catch (error) {
    return res.status(500).send('Error displaying user stats: ' + error.message)
  }
})

module.exports = account
