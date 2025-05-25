document.addEventListener('DOMContentLoaded', () => {
  const logsTable = document.getElementById('logs-table')
  const refreshBtn = document.getElementById('refresh')

  function formatTimestamp (timestamp) {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleString()
    } catch (err) {
      return 'Invalid Date'
    }
  }

  async function fetchLogs () {
    try {
      const response = await fetch('/admin/logs')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const logs = await response.json()

      if (!Array.isArray(logs)) {
        return
      }

      const tableRows = logs.map(log => `
        <tr>
          <td>${formatTimestamp(log.timestamp)}</td>
          <td>${log.players || 'unknown'}</td>
          <td>${log.action || 'unknown'}</td>
          <td>${log.details || ''}</td>
        </tr>
      `).join('')

      logsTable.innerHTML = `
        <tr>
          <th>Time</th>
          <th>Player</th>
          <th>Action</th>
          <th>Details</th>
        </tr>
        ${tableRows}
      `
    } catch (error) {
      logsTable.innerHTML = '<tr><td colspan="4">Error loading logs. Check console for details.</td></tr>'
    }
  }

  refreshBtn.addEventListener('click', fetchLogs)
  fetchLogs()
})
