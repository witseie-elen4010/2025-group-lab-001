'use strict'

const bcrypt = require('bcrypt')
const valid = require('validator')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')

// JWT secret key from environment variable with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

let playerIdCounter = 1 // Counter for generating unique player IDs

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'plasticflamingoes.thegame@gmail.com',
    pass: 'gpda zvoo pjwm azsf'
  }
})

class Account {
  constructor (email, username, password) {
    this.email = email
    this.username = username
    this.password = password
    this.playerId = playerIdCounter++ // Increment counter for each new account
    this.pastGames = [] // Store the leaderboards of the past 5 games
    this.rankedPoints = 0
  }
}

class OTPAccount {
  constructor (username, otp) {
    this.username = username
    this.otp = otp
  }
}

const otpAccounts = []

const hashPassword = async function (password) {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

const accounts = []
const testPassword = '123'
const newAccount = new Account('test@pf.org', 'testUser', bcrypt.hashSync(testPassword, 10))
accounts.push(newAccount)

const generateToken = (username, playerId, gameInfo = null) => {
  const payload = {
    username,
    playerId,
    ...(gameInfo && { gameInfo })
  }
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
  return token
}

const checkValidUser = async function (username, playerId) {
  return accounts.some(account => account.username === username && account.playerId === playerId)
}

const createAccount = async function (email, username, password, confirmPassword) {
  try {
    await checkValidAccount(email, username, password, confirmPassword)

    const hashedPassword = await hashPassword(password)
    const newAccount = new Account(email, username, hashedPassword)
    accounts.push(newAccount)

    const result = {
      username: newAccount.username,
      playerId: newAccount.playerId
    }
    return result
  } catch (err) {
    return err
  }
}

const checkValidAccount = async function (email, username, password, confirmPassword) {
  if (!checkValidEmail(email)) {
    throw new Error('Invalid email format')
  }
  if (!(await checkEmailAvailable(email))) {
    throw new Error('Email is already in use')
  }
  if (!checkValidUsername(username)) {
    throw new Error('Invalid username format')
  }
  if (!(await checkUsernameAvailable(username))) {
    throw new Error('Username is already in use')
  }
  if (!checkPasswordConfirmed(password, confirmPassword)) {
    throw new Error('Passwords do not match')
  }
  return true
}

const checkValidEmail = function (email) {
  return valid.isEmail(email)
}

const checkEmailAvailable = async function (email) {
  return !accounts.some(account => account.email === email)
}

const checkValidUsername = function (username) {
  return valid.isAlphanumeric(username) && username.length >= 3 && username.length <= 20
}

const checkUsernameAvailable = async function (username) {
  return !accounts.some(account => account.username === username)
}

const checkPasswordConfirmed = function (password, confirmPassword) {
  return password === confirmPassword
}

const loginAccount = async function (email, password) {
  let user
  for (const account of accounts) {
    if (account.email === email) {
      user = account
      break
    }
  }

  if (!user) {
    return new Error('Account not found')
  }

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    return new Error('Incorrect password')
  }

  return user
}

const checkIfUser = async function (email) {
  const result = accounts.some(account => account.email === email)
  if (!result) {
    return new Error('Account not found')
  }
  return result
}

const getUsername = async function (email) {
  const account = accounts.find(account => account.email === email)
  if (!account) {
    return new Error('Account not found')
  }
  return account.username
}

const getEmail = async function (username) {
  const account = accounts.find(account => account.username === username)
  if (!account) {
    return new Error('Account not found')
  }
  return account.email
}

const sendOTP = async function (email) {
  const otp = await generateOTP()

  const mailOptions = {
    from: 'plasticflamingoes.thegame@gamil.com',
    to: email,
    subject: 'Your OTP Code',
    text: 'Your OTP code is: \n' + otp
  }

  try {
    await transporter.sendMail(mailOptions)
    // console.log('OTP sent successfully')
    const otpAccount = new OTPAccount(await getUsername(email), otp)
    otpAccounts.push(otpAccount)
  } catch (error) {
    // console.error('Error sending OTP:', error)
    return new Error('Failed to send OTP')
  }
  deleteOldOTPs(await getUsername(email))
  return otp
}

const deleteOldOTPs = async function (username) {
  let count = 0
  for (let i = 0; i < otpAccounts.length; i++) {
    if (otpAccounts[i].username === username) {
      count++
    }
  }
  if (count > 1) {
    for (let i = 0; i < otpAccounts.length; i++) {
      if (otpAccounts[i].username === username) {
        otpAccounts.splice(i, 1)
        i--
        count--
        if (count <= 1) {
          break
        }
      }
    }
  }
}

const generateOTP = async function () {
  const digits = '0123456789'
  let otp = ''
  const len = digits.length
  for (let i = 0; i < 4; i++) {
    otp += digits[Math.floor(Math.random() * len)]
  }
  return otp
}

const verifyOTP = async function (username, otp) {
  const account = otpAccounts.find(account => account.username === username)
  if (!account) {
    return new Error('Account not found')
  }
  if (account.otp !== otp) {
    return new Error('Invalid OTP')
  }
  // Remove the OTP account after successful verification
  const index = otpAccounts.indexOf(account)
  if (index > -1) {
    otpAccounts.splice(index, 1)
  }
  return true
}

const resetPassword = async function (username, password, confirmPassword) {
  if (!checkPasswordConfirmed(password, confirmPassword)) {
    return new Error('Passwords do not match')
  }
  const account = accounts.find(account => account.username === username)
  if (!account) {
    return new Error('Account not found')
  }
  account.password = await hashPassword(password)
  return true
}

const storeGameResult = function (game) {
  if (!game || !game.leaderboard) {
    return false
  }

  const gameResult = {
    gameId: game.gameID,
    date: new Date().toISOString(),
    totalRounds: game.totalRounds,
    leaderboard: game.leaderboard.entries.map(entry => ({
      playerId: entry.playerId,
      username: entry.username,
      points: entry.points
    })),
    winner: game.winner
  }

  let allFound = true
  game.players.forEach(player => {
    // const account = accounts.find(acc => acc.playerId === player.getId())
    const account = accounts.find(acc => acc.playerId === 1)
    if (account) {
      account.pastGames.unshift(gameResult)

      // ONLY 5 GAMES
      if (account.pastGames.length > 5) {
        account.pastGames.pop()
      }

      // for now just add points total to player points
      const playerEntry = gameResult.leaderboard.find(entry => entry.playerId === player.getId())
      if (playerEntry) {
        account.rankedPoints += playerEntry.points
      }
    } else {
      allFound = false
    }
  })

  return allFound
}

module.exports = {
  createAccount,
  checkValidAccount,
  checkValidEmail,
  checkEmailAvailable,
  checkValidUsername,
  checkUsernameAvailable,
  checkPasswordConfirmed,
  hashPassword,
  loginAccount,
  generateToken,
  checkValidUser,
  checkIfUser,
  getUsername,
  getEmail,
  sendOTP,
  verifyOTP,
  resetPassword,
  generateOTP,
  deleteOldOTPs,
  storeGameResult,
  accounts,
  otpAccounts
}
