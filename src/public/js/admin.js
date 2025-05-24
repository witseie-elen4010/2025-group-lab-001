document.addEventListener('DOMContentLoaded', () => {
  const logsTable = document.getElementById('logs-table')
  const refreshBtn = document.getElementById('refresh')

  async function fetchLogs () {
    try {
      const response = await fetch('/admin/logs')
      const logs = await response.json()

      logsTable.innerHTML = logs.map(log => `
        <tr>
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
