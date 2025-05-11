document.addEventListener('DOMContentLoaded', () => {
  const voteForm = document.getElementById('voteForm')
  const playerIdInput = document.getElementById('playerId')
  const errorDisplay = document.getElementById('errorDisplay')

  /* eslint-disable */
const socket = io()

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

  socket.on('start game', () => {
    window.location.href = '/gaming/wordShare'
  })
  
  socket.on('next round', () => {
    window.location.href = '/gaming/next-round'
  })
})
