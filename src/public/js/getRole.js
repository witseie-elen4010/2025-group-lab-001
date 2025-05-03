document.addEventListener('DOMContentLoaded', () => {
  const roleDisplay = document.createElement('div')
  roleDisplay.id = 'role-display'
  document.body.insertBefore(roleDisplay, document.body.firstChild)

  async function fetchRole () {
    try {
      const res = await fetch('/gaming/role')

      if (!res.ok) {
        throw new Error(`Failed to fetch role: ${res.status}`)
      }

      const data = await res.json()

      if (!data || !data.role) {
        throw new Error('Invalid role data received')
      }

      roleDisplay.textContent = `Your role: ${data.role}`
    } catch (error) {
      console.error('Error fetching role:', error)
      roleDisplay.textContent = 'Failed to load role'
      roleDisplay.style.color = 'red'
    }
  }

  // Initial role fetch
  fetchRole().catch(error => {
    console.error('Initial role fetch failed:', error)
    roleDisplay.textContent = 'Failed to load role'
    roleDisplay.style.color = 'red'
  })
})
