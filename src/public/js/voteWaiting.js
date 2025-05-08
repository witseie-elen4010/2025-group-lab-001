document.addEventListener('DOMContentLoaded', () => {
  /* eslint-disable */
    const refreshBtn = document.getElementById('refresh-btn')
    refreshBtn.addEventListener('click', async () => {
    try {
        const res = await fetch('/gaming/state')
        if (!res.ok) {
        throw new Error(`Failed to fetch game state: ${res.status}`)
        }
        const data = await res.json()
        if (data.state === 'share') {
        window.location.href = '/gaming/wordShare'
        } else if (data.state === 'finished') {
        window.location.href = '/gaming/finished'
        } else {
        alert('Voting is still in progress. Please wait for all players to finish.')
        }
    } 
    catch (error) {
        console.error('Error fetching game state:', error)
        alert('Failed to load game state. Please try again.')
    }
    })
})
