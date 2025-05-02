'use-strict'

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

// Import routes
const gaming = require('../routes/gaming')
const indexRouter = require('../routes/index')

function createApp () {
  const app = express()

  // Configure middleware
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(cookieParser())

  app.use('/scripts', express.static(path.join(__dirname, '..', 'public', 'js')))

  // Configure routes
  app.use('/gaming', gaming)
  app.use('/', indexRouter)

  return app
}

module.exports = createApp
