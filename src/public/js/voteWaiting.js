document.addEventListener('DOMContentLoaded', () => {
  /* eslint-disable */
const socket = io()

socket.on('start game', (gameID) => {
  if (gameID === cookies.gameID) {
    window.location.href = '/gaming/wordShare'
  }
})

socket.on('next round', (gameID) => {
  if (gameID === cookies.gameID) {
    window.location.href = '/gaming/next-round'
  }
})
})
