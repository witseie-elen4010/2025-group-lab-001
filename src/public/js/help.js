const openPopupButton = document.getElementById('open-popup')
const popup = document.getElementById('my-popup')
const closeButton = document.querySelector('.close-button')

openPopupButton.addEventListener('click', () => {
  popup.style.display = 'block'
})

closeButton.addEventListener('click', () => {
  popup.style.display = 'none'
})

window.addEventListener('click', (event) => {
  if (event.target === popup) {
    popup.style.display = 'none'
  }
})
