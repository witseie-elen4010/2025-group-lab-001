'use strict'

/* eslint-disable */
const socket = io()


const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split('=')
  acc[key] = value
  return acc
}, {})

const startButton = document.getElementById('start-game-btn')

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

  
if (cookies.playerID !== cookies.hostID) {
  startButton.style.display = 'none'
}
})



startButton.addEventListener('click', () => {
 socket.emit('start game')
})

socket.on('start game', () => {
  window.location.href = '/gaming/wordShare'
})


