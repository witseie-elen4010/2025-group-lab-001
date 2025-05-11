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

form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (input.value) {
    socket.emit('chat message', input.value)
    input.value = ''
  }
})

socket.on('chat message', (msg) => {
  const item = document.createElement('li')
  item.textContent = msg
  messages.appendChild(item)
  window.scrollTo(0, document.body.scrollHeight)
})

const discussButton = document.getElementById('discuss-btn')

if(cookies.playerID !== cookies.hostID) {
  discussButton.style.display = 'none'
}

discussButton.addEventListener('click', () => {
    socket.emit('start discussion')
  })

  socket.on('start discussion', () => {
    window.location.href = '/gaming/chatRoom'
  })
