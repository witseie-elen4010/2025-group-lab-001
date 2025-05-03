document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-btn')
  const playerList = document.getElementById('player-list')
  const errorDisplay = document.createElement('div')
  errorDisplay.style.color = 'red'
  playerList.parentNode.insertBefore(errorDisplay, playerList)

  async function fetchPlayers () {
    try {
      errorDisplay.textContent = '' // Clear any previous errors
      const res = await fetch('/gaming/players')

      if (!res.ok) {
        throw new Error(`Failed to fetch players: ${res.status}`)
      }

      const data = await res.json()

      if (!data || !Array.isArray(data.players)) {
        throw new Error('Invalid data received from server')
      }

      playerList.innerHTML = ''

      if (data.players.length === 0) {
        const emptyMessage = document.createElement('li')
        emptyMessage.textContent = 'Waiting for other players to join...'
        emptyMessage.style.fontStyle = 'italic'
        playerList.appendChild(emptyMessage)
        return
      }

      data.players.forEach(playerId => {
        const li = document.createElement('li')
        li.textContent = `Player ${playerId}`
        playerList.appendChild(li)
      })
    } catch (error) {
      console.error('Error fetching players:', error)
      errorDisplay.textContent = 'Failed to load players. Please try again.'
      playerList.innerHTML = '' // Clear list on error
    }
  }

  refreshBtn.addEventListener('click', fetchPlayers)

  // Initial fetch with error handling
  fetchPlayers().catch(error => {
    console.error('Initial load failed:', error)
    errorDisplay.textContent = 'Failed to load players. Please try again.'
  })
})
