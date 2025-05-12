'use strict'

/* eslint-disable */
const socket = io()

const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=')
  acc[key] = value
  return acc
}, {})


const form = document.getElementById('form')
const input = document.getElementById('groupChat')
const messages = document.getElementById('messages')
const votingButton = document.getElementById('voting-btn')

let log = []

// Get the player ID from a cookie or another source
const playerID = document.cookie
  .split('; ')
  .find(row => row.startsWith('playerID='))
  ?.split('=')[1]

// Load the chat log when the page is loaded
window.addEventListener('DOMContentLoaded', () => {
  const savedLog = window.localStorage.getItem('chatLog')
  if (savedLog) {
    log = JSON.parse(savedLog)
    log.forEach((entry) => {
      const item = document.createElement('li')
      item.textContent = entry
      messages.appendChild(item)
    })
    window.scrollTo(0, document.body.scrollHeight)
  }

  if (cookies.spectator === 'true') {
    // Add a heading for spectators
    const spectatorHeading = document.createElement('h1')
    spectatorHeading.textContent = 'Spectator'
    document.body.prepend(spectatorHeading)

    // Hide all buttons on the page
    const buttons = document.querySelectorAll('button')
    buttons.forEach((button) => {
      button.style.display = 'none'
    })

    const inputs = document.querySelectorAll('input, textarea, select')
    inputs.forEach((input) => {
    input.disabled = true
    })
  }

if(cookies.playerID !== cookies.hostID) {
  votingButton.style.display = 'none'
}
})

form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (input.value) {
    const message = {
      playerID,
      text: input.value,
      timestamp: new Date().toISOString()
    }
    socket.emit('chat message', message, cookies.gameID)
    input.value = ''
  }
})

socket.on('chat message', (msg, gameID) => {
  if(gameID === cookies.gameID) {
  const item = document.createElement('li')
  const timestamp = new Date(msg.timestamp).toLocaleTimeString()
  const message = `[${timestamp}] Player ${msg.playerID}: ${msg.text}`
  item.textContent = message
  log.push(message)
  messages.appendChild(item)
  window.scrollTo(0, document.body.scrollHeight)
  }
})

votingButton.addEventListener('click', () => {
    socket.emit('start voting', cookies.gameID)
  })

  socket.on('start voting', (gameID) => {
    if(gameID === cookies.gameID) {
    window.location.href = '/gaming/setUpVoting'
    }
  })
