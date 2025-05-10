'use strict'
const express = require('express')

const app = express()
app.use(express.urlencoded({ extended: true }))

const router = require('@routes/homeRoutes')

module.exports = router
