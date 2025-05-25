require('dotenv').config()
const mssql = require('mssql')
// Make sure this is private to this module
const config = {
  server: 'plasticflamingoes2.database.windows.net',
  database: 'plasticflamingoes',
  user: process.env.AzureDBAdmin,
  password: process.env.AzureDBPassword,
  port: 1433,
  options: {
    encrypt: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
}

let pool = null
let isConnected = false
let connectionError = null

async function getPool () {
  if (pool) return pool

  try {
    pool = await new mssql.ConnectionPool(config).connect()
    isConnected = true
    console.log('Connected to DB')
    return pool
  } catch (err) {
    isConnected = false
    connectionError = err
    console.log(err)
    throw err
  }
}

module.exports = {
  sql: mssql,
  getPool,
  isConnected: () => isConnected,
  connectionError: () => connectionError
}
