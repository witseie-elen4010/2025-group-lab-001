/* eslint-disable */
document.addEventListener('DOMContentLoaded', () => {
    const createAccountBtn = document.getElementById('create-account-btn')
    createAccountBtn.addEventListener('click', async () => {
        window.location.href = '/createAccount'
    })
})
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn')
    loginBtn.addEventListener('click', async () => {
        window.location.href = '/login'
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
