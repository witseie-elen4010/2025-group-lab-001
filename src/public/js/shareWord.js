document.addEventListener('DOMContentLoaded', () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {})

  // Get playerId and game info from JWT token
  const token = cookies.token
  const payload = JSON.parse(atob(token.split('.')[1]))
  const gameInfo = payload.gameInfo
  if (gameInfo?.isSpectator) {
    return
  }
  const wordElement = document.getElementById('word')

  // Fetch the player's word from the server
  fetch('/gaming/getWord')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch the word')
      }
      return response.json()
    })
    .then((data) => {
      // Display the word in the <h2> element
      wordElement.textContent = data.word
    })
    .catch((error) => {
      console.error('Error fetching the word:', error)
      wordElement.textContent = 'Error fetching your word.'
    })
})
