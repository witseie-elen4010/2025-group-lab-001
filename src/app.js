'use strict'
require('dotenv').config()
require('module-alias/register')
const createApp = require('@config/express')

const app = createApp()

const PORT = process.env.PORT || 3000
app.listen(PORT, (err) => {
  if (err) {
    console.log('Server start-up failed')
  } else {
    console.log(`Server is running on port ${PORT}`)
  }
})
