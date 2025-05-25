'use strict'
const express = require('express')
const path = require('path')
const { getRequestLogs } = require('@middleware/requestLogger')

const admin = express.Router()

// Basic auth middleware - you might want to enhance this
// const adminAuth = (req, res, next) => {
//   const authHeader = req.headers.authorization
//   if (authHeader === 'Bearer admin-secret') {
//     next()
//   } else {
//     res.status(401).send('Unauthorized')
//   }
// }
//
// admin.use(adminAuth)

admin.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'admin.html'))
})

admin.get('/logs', async (req, res) => {
  try {
    const logs = await getRequestLogs()
    res.json(logs)
  } catch (error) {
    console.error('Error in /admin/logs route:', error)
    res.status(500).json({ error: 'Failed to fetch logs' })
  }
})

module.exports = admin
