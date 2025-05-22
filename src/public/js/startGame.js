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
const playerId = payload.playerId
const gameInfo = payload.gameInfo

const startButton = document.getElementById('start-game-btn')
document.addEventListener('DOMContentLoaded', () => {
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
    startButton.style.display = 'none'
  }
})

// Add click event listener
startButton.addEventListener('click', async () => {
  try {
    const response = await fetch('/gaming/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (response.ok) {
      // Emit start game event
      socket.emit('start game', {
        playerId,
        gameId: gameInfo.gameId
      })
      window.location.href = '/gaming/wordShare'
    }
  } catch (error) {
    console.error('Error starting game:', error)
  }
})

socket.on('start game', () => {
  window.location.href = '/gaming/wordShare'
})


