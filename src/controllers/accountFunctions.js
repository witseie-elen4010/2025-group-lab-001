'use strict'

const bcrypt = require('bcrypt')
const valid = require('validator')
const jwt = require('jsonwebtoken')

// JWT secret key from environment variable with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

let playerIdCounter = 1 // Counter for generating unique player IDs

class Account {
  constructor (email, username, password) {
    this.email = email
    this.username = username
    this.password = password
    this.playerId = playerIdCounter++ // Increment counter for each new account
  }
}

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
  accounts,
  generateToken,
  checkValidUser
}
