'use strict'

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { requestLoggerMiddleware } = require('../middleware/requestLogger')

// Import routes
const gaming = require('@routes/gaming')
const home = require('@routes/home')
const admin = require('@routes/admin')

function createApp () {
  const app = express()

  // Configure middleware
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(requestLoggerMiddleware) // Add the logger middleware

  app.use('/scripts', express.static(path.join(__dirname, '..', 'public', 'js')))

  // The code commented below is for debugging purposes. It returns the request method and URL for each request made to the server.
  // app.use((req, res, next) => {
  //   console.log(req.method, req.url)
  //   next()
  // })

  // Configure routes
  app.use('/admin', admin)
  app.use('/gaming', gaming)
  app.use('/', home)

  app.use((req, res, next) => {
    const error = new Error('Not Found')
    error.status = 404
    next(error)
  })

  // Global error handler
  app.use((err, req, res, next) => {
    // Log error details on server
    // console.error('Server Error:', {
    //   timestamp: new Date().toISOString(),
    //   error: err.message,
    //   stack: err.stack,
    //   url: req.url,
    //   method: req.method,
    //   statusCode: err.status || 500
    // })

    res.status(err.status || 500)
    res.sendFile(path.join(__dirname, '..', 'views', 'error.html'))
  })

  return app
}

module.exports = createApp
