document.addEventListener('DOMContentLoaded', () => {
  /* eslint-disable */
const socket = io()

const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {})

  const token = cookies.token
  const payload = JSON.parse(atob(token.split('.')[1]))
  const playerId = payload.playerId
  const gameInfo = payload.gameInfo

  socket.on('show vote results', (gameID) => {
    if (Number(gameID) === Number(gameInfo?.gameId)) {
      window.location.href = '/gaming/voteResults'
    }
  })
  
  socket.on('start game', (gameID) => {
    if (Number(gameID) === Number(gameInfo?.gameId)) {
      window.location.href = '/gaming/wordShare'
    }
  })
  
  socket.on('next round', (gameID) => {
    if (Number(gameID) === Number(gameInfo?.gameId)) {
      window.location.href = '/gaming/next-round'
    }
  })
})
