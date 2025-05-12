document.addEventListener('DOMContentLoaded', () => {
  /* eslint-disable */
const socket = io()

const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {})

  socket.on('start game', (gameID) => {
    if (Number(gameID) === Number(cookies.gameID)) {
      window.location.href = '/gaming/wordShare'
    }
  })
  
  socket.on('next round', (gameID) => {
    if (Number(gameID) === Number(cookies.gameID)) {
      window.location.href = '/gaming/next-round'
    }
  })
})
