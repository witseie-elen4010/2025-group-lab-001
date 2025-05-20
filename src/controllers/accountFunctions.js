'use strict'

const bcrypt = require('bcrypt')
const valid = require('validator')
const jwt = require('jsonwebtoken')

// JWT secret key - in production this should be in environment variables
const JWT_SECRET = 'your-secret-key'

class Account {
  constructor (email, username, password) {
    this.email = email
    this.username = username
    this.password = password
    this.playerId = Math.floor(Math.random() * 1000000) // Generate a random player ID
  }
}

const hashPassword = async function (password) {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

const accounts = []
const testPassword = '$2b$10$ynpM9dRFQBcgNjUovRYUeOavPTpBQFM9U2MK9L70VddynK5.duM2u'
const newAccount = new Account('test@plasticflamingoes.org', 'testUser', testPassword)
accounts.push(newAccount)

const generateToken = (username, playerId) => {
  return jwt.sign({ username, playerId }, JWT_SECRET, { expiresIn: '24h' })
}

const createAccount = async function (email, username, password, confirmPassword) {
  try {
    await checkValidAccount(email, username, password, confirmPassword)
    const hashedPassword = await hashPassword(password)
    const newAccount = new Account(email, username, hashedPassword)
    // Here you would typically save the account to a database
    accounts.push(newAccount)
    return newAccount
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

  //   console.log('User:', user)
  if (!user) {
    return new Error('Account not found')
  }

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    return new Error('Incorrect password')
  }
  //   console.log('Login successful in af')
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
  generateToken
}
