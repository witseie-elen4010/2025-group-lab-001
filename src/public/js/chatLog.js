'use strict'

/* eslint-disable */
const socket = io()

const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=')
  acc[key] = value
  return acc
}, {})

const token = cookies.token
const payload = JSON.parse(atob(token.split('.')[1]))
const playerID = payload.playerId
const gameInfo = payload.gameInfo

const form = document.getElementById('form')
const input = document.getElementById('groupChat')
const messages = document.getElementById('messages')
const votingButton = document.getElementById('voting-btn')

let log = []

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

  if (gameInfo?.isSpectator === 'true') {
    const spectatorHeading = document.createElement('h1')
    spectatorHeading.textContent = 'Spectator'
    document.body.prepend(spectatorHeading)

    const buttons = document.querySelectorAll('button')
    buttons.forEach((button) => {
      button.style.display = 'none'
    })

    const inputs = document.querySelectorAll('input, textarea, select')
    inputs.forEach((input) => {
    input.disabled = true
    })
  }

if(gameInfo?.isHost === 'false') {
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
    socket.emit('chat message', message, Number(gameInfo?.gameId))
    input.value = ''
  }
})

socket.on('chat message', (msg, gameID) => {
  if(Number(gameID) === Number(gameInfo?.gameId)) {
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
    socket.emit('start voting', gameInfo?.gameId)
  })

  socket.on('start voting', (gameID) => {
    if(Number(gameID) === Number(gameInfo?.gameId)) {
    window.location.href = '/gaming/setUpVoting'
    }
  })
