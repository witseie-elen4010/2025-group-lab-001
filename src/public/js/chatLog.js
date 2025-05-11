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
})

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

const votingButton = document.getElementById('voting-btn')

if(cookies.playerID !== cookies.hostID) {
  votingButton.style.display = 'none'
}

votingButton.addEventListener('click', () => {
    socket.emit('start voting')
  })

  socket.on('start voting', () => {
    window.location.href = '/gaming/setUpVoting'
  })
