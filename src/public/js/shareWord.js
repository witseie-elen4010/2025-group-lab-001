document.addEventListener('DOMContentLoaded', () => {
  const wordElement = document.getElementById('word')

  // Fetch the player's word from the server
  fetch('/gaming/wordShare')
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
