document.addEventListener('DOMContentLoaded', () => {
  /* eslint-disable */
const socket = io()

    socket.on('start game', () => {
        window.location.href = '/gaming/wordShare'
      })
    
      socket.on('next round', () => {
        window.location.href = '/gaming/next-round'
      })
})
