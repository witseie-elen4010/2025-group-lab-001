document.addEventListener('DOMContentLoaded', () => {
  const voteForm = document.getElementById('voteForm')
  const playerIdInput = document.getElementById('playerId')
  const errorDisplay = document.getElementById('errorDisplay')

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

  voteForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    errorDisplay.textContent = '' // Clear previous errors

    const response = await fetch('/gaming/voting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote: playerIdInput.value.trim() })
    })
    // console.log('Response:', response)

    if (response.ok) {
      window.location.href = response.url
    } else {
      errorDisplay.textContent = 'Vote failed. Please try again.'
    }
  })


if (gameInfo?.isSpectator === 'true') {
  window.location.href = '/gaming/waitingForVotes'
}
  
  socket.on('next round', (gameID) => {
    if (Number(gameID) === Number(gameInfo?.gameId)) {
      window.location.href = '/gaming/next-round'
    }
  })
})
