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


async function handleAdminLogin () {
  const email = document.querySelector('input[name="email"]').value
  const password = document.querySelector('input[name="password"]').value

  try {
    const response = await fetch('/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (response.ok) {
      // Handle successful login
      window.location.href = '/admin'
    } else {
      // Handle login error
      alert(data.message || 'Admin login failed')
    }
  } catch (error) {
    console.error('Error during admin login:', error)
    alert('An error occurred during login')
  }
}
