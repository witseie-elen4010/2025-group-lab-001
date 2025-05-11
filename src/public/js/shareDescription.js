'use strict'
/* eslint-disable */
const socket = io()

const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=')
  acc[key] = value
  return acc
}, {})

const form = document.getElementById('form')
const input = document.getElementById('wordDescription')
const messages = document.getElementById('messages')

const playerID = cookies.playerID; // Retrieve playerID from cookies
let log = []

form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (input.value) {
    const message = {
      playerID,
      text: input.value,
      timestamp: new Date().toISOString()
    }
    socket.emit('chat message', message)
    input.value = ''
  }
})

socket.on('chat message', (msg) => {
  const item = document.createElement('li')
  const timestamp = new Date(msg.timestamp).toLocaleTimeString()
  const message = `[${timestamp}] Player ${msg.playerID}: ${msg.text}`
  item.textContent = message
  log.push(message)
  messages.appendChild(item)
  window.scrollTo(0, document.body.scrollHeight)
})

const discussButton = document.getElementById('discuss-btn')

document.addEventListener('DOMContentLoaded', () => {
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
  discussButton.style.display = 'none'
}
})

discussButton.addEventListener('click', () => {
    socket.emit('start discussion')
  })

  socket.on('start discussion', () => {
    window.location.href = '/gaming/chatRoom'
  })
