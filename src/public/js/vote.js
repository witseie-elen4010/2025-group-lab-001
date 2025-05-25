document.addEventListener('DOMContentLoaded', () => {
  const voteForm = document.getElementById('voteForm')
  const errorDisplay = document.getElementById('errorDisplay')

  /* eslint-disable */
const socket = io()

createVoteRadioButtons()

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
    const selectedVoteRadio = document.querySelector('input[name="vote"]:checked');
    if (!selectedVoteRadio) {
        errorDisplay.textContent = 'Please select a player to vote for.';
        return; // Stop the submission if no radio button is selected
    }
    const voteValue = selectedVoteRadio.value;
    // console.log('Vote value:', voteValue)

    const response = await fetch('/gaming/voting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteValue })
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

const createVoteRadioButtons = async function (){
  const playerList = document.getElementById('playerList')
  // const players = JSON.parse(playerList.dataset.players)
  const res = await fetch('/gaming/votingPlayers')
  const data = await res.json()

  data.players.forEach(playerId => {
    const label = document.createElement('label')
    label.textContent = `Player ${playerId}`
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'vote'
    input.value = playerId
    input.id = `vote-${playerId}`
    
    label.appendChild(input)
    playerList.appendChild(label)
    playerList.appendChild(document.createElement('br'))
  })
}