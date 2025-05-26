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

document.addEventListener('DOMContentLoaded', async () => {
    const roleDisplay = document.getElementById('roles-container')
    const role = await getRole()

    const node = document.createElement('p')
    node.textContent = `Your role is: ${role}`
    roleDisplay.appendChild(node)

    // Only the host should emit the share description event
    if (gameInfo?.isHost) {
        setTimeout(() => {
            socket.emit('share description', {gameId: gameInfo.gameId})
        }, 3000)
    }
})

const getRole = async function () {
    const res = await fetch('/gaming/role')
    if (!res.ok) {
        throw new Error('Failed to fetch role')
    }
    const data = await res.json()
    return data.role
}

// All players listen for share description to move to next phase
socket.on('share description', (gameID) => {
    if (Number(gameID) === Number(gameInfo.gameId)) {
        window.location.href = '/gaming/wordShare'
    }
})