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
const gameInfo = payload.gameInfo

document.addEventListener('DOMContentLoaded', async () => {
    let redirectTriggered = false;
    
    async function redirect(path) {
        if (!redirectTriggered) {
            redirectTriggered = true;
            window.location.href = path;
        }
    }

    try {
        // Get voted player result from server
        const res = await fetch('/gaming/voteResult')
        if (!res.ok) {
            throw new Error('Failed to fetch vote result')
        }
        const data = await res.json()
        
        // Display result
        const resultContainer = document.getElementById('vote-result')
        if (data.noOneVoted) {
            resultContainer.textContent = "No one was voted out!"
        } else {
            resultContainer.textContent = `Player ${data.votedOutId} was voted out!${data.wasImposter ? ' They were the imposter!' : ''}`
        }
        
        // After 3 seconds, redirect to the next phase
        setTimeout(() => {
            if (data.gameComplete) {
                redirect(`/gaming/leaderboard/${gameInfo.gameId}`)
            } else {
                redirect('/gaming/wordShare')
            }
        }, 3000)
    } catch (error) {
        console.error('Error:', error);
        // If there's an error, redirect to wordShare if possible
        setTimeout(() => {
            redirect('/gaming/wordShare')
        }, 3000)
    }
})

// Listen for game end/next round events as backup
socket.on('next round', (gameID) => {
    if (Number(gameID) === Number(gameInfo?.gameId)) {
        window.location.href = '/gaming/next-round'
    }
})

socket.on('game end', (gameID) => {
    if (Number(gameID) === Number(gameInfo?.gameId)) {
        window.location.href = `/gaming/leaderboard/${gameID}`
    }
})
