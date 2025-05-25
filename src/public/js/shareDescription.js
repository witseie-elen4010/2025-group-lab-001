'use strict'
/* eslint-disable */
const socket = io()

const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=')
  acc[key] = value
  return acc
}, {})

// Get playerId and game info from JWT token
const token = cookies.token
const payload = JSON.parse(atob(token.split('.')[1]))
const playerId = payload.playerId
const gameInfo = payload.gameInfo

const form = document.getElementById('form')
const input = document.getElementById('wordDescription')
const messages = document.getElementById('messages')

let log = []

form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (input.value) {
    const message = {
      playerId,
      text: input.value,
      timestamp: new Date().toISOString()
    }
    socket.emit('chat message', message, gameInfo.gameId)
    input.value = ''
  }
})

socket.on('chat message', (msg, gameId) => {
  if (Number(gameId) === Number(gameInfo.gameId)) {
    const item = document.createElement('li')
    const timestamp = new Date(msg.timestamp).toLocaleTimeString()
    const message = `[${timestamp}] Player ${msg.playerId}: ${msg.text}`
    item.textContent = message
    log.push(message)
    messages.appendChild(item)
    window.scrollTo(0, document.body.scrollHeight)
  }
})

const discussButton = document.getElementById('discuss-btn')

document.addEventListener('DOMContentLoaded', () => {
  console.log(gameInfo)
  if (gameInfo?.isSpectator) {
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

  if (!gameInfo?.isHost) {
    discussButton.style.display = 'none'
  }
})

discussButton.addEventListener('click', () => {
  socket.emit('stop timer', gameInfo.gameId)
  socket.emit('start discussion', gameInfo.gameId)
  
})

socket.on('start discussion', (gameId) => {
  if (Number(gameId) === Number(gameInfo.gameId)) {
    window.location.href = '/gaming/chatRoom'
  }
})

const timeDisplay = document.getElementById('timeUpdate')
socket.on('time update', (timeUpdate, gameID) => {
  if (Number(gameID) === Number(gameInfo.gameId)) {
  timeDisplay.textContent = timeUpdate
  }
})