document.addEventListener('DOMContentLoaded', () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {})

  const startButton = document.getElementById('start-game-btn')

  startButton.addEventListener('click', async () => {
    try {
      if (cookies.playerID === cookies.hostID) {
        const res = await fetch('/gaming/start', {
          method: 'POST'
        })
        if (!res.ok) {
          throw new Error(`Failed to start game: ${res.status}`)
        }
        window.location.href = '/gaming/wordShare'
      } else {
        const res = await fetch('/gaming/state')
        if (!res.ok) {
          throw new Error(`Failed to check game state: ${res.status}`)
        }

        const data = await res.json()
        if (data.state === 'share') {
          window.location.href = '/gaming/wordShare'
        } else {
          /* eslint-disable */
          alert('Waiting for host to start the game...')
        }
      }
    } catch (error) {
      console.error('Error:', error)
    }
  })
})
