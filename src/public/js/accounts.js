document.addEventListener('DOMContentLoaded', () => {
  /* eslint-disable */
    const createAccountBtn = document.getElementById('create-account-btn')
    createAccountBtn.addEventListener('click', async () => {
        window.location.href = '/createAccount'
    })
})

const params = new URLSearchParams(window.location.search)
const error = params.get('error')
if (error) {
  const message = document.querySelector('p')
  if (message) {
    message.innerText = error
    message.style.color = 'red'
  } else {
    alert(error) // fallback
  }
}
