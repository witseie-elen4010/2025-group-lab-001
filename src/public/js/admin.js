document.addEventListener('DOMContentLoaded', () => {
  const logsTable = document.getElementById('logs-table')
  const refreshBtn = document.getElementById('refresh')

  function formatTimestamp (timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleString() // This will show date and time in local format
  }

  async function fetchLogs () {
    try {
      const response = await fetch('/admin/logs')
      const logs = await response.json()

      logsTable.innerHTML = logs.map(log => `
        <tr>
          <td>${formatTimestamp(log.timestamp)}</td>
          <td>${log.players}</td>
          <td>${log.action}</td>
          <td>${log.details}</td>
        </tr>
      `).join('')
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  refreshBtn.addEventListener('click', fetchLogs)
  fetchLogs()
})
