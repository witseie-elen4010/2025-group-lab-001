document.addEventListener('DOMContentLoaded', () => {
  const logsTable = document.getElementById('logs-table')
  const refreshBtn = document.getElementById('refresh')

  async function fetchLogs () {
    try {
      const response = await fetch('/admin/logs')
      const logs = await response.json()

      logsTable.innerHTML = logs.map(log => `
        <tr>
          <td>${new Date(log.timestamp).toLocaleString()}</td>
          <td>${log.type || 'http'}</td>
          <td>${log.playerID}</td>
          <td>${log.method}</td>
          <td>${log.url} ${JSON.stringify(log.body)}</td>
        </tr>
      `).join('')
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  refreshBtn.addEventListener('click', fetchLogs)
  fetchLogs()
})
