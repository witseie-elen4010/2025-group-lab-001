document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-btn')
  const playerList = document.getElementById('player-list')

  async function fetchPlayers () {
    const res = await fetch('/gaming/players')
    const data = await res.json()
    playerList.innerHTML = ''
    data.players.forEach(playerId => {
      const li = document.createElement('li')
      li.textContent = `Player ${playerId}`
      playerList.appendChild(li)
    })
  }

  refreshBtn.addEventListener('click', fetchPlayers)

  fetchPlayers()
})
