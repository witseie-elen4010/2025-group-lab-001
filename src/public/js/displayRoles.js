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

    setTimeout(() => {
        // console.log('Emitting share description event')
        socket.emit('share description', {playerId, gameId: gameInfo.gameId})
        window.location.href = '/gaming/wordShare'
    }, 3000)
})

const getRole = async function () {
    const res = await fetch('/gaming/role')
    if (!res.ok) {
        throw new Error('Failed to fetch role')
    }
    const data = await res.json()
    // console.log('Role fetched:', data.role)
    return data.role
}

socket.on('share description', () => {
    window.location.href = '/gaming/wordShare'
})