import { useState, useContext } from 'react'
import { ConnectionContext } from '../context/ConnectionContext'
import './History.css'

export function History() {
  const context = useContext(ConnectionContext)
  const { darkMode } = context

  // Start with empty history (in real app, would fetch from backend)
  const [historyItems] = useState([])

  const handleDownload = (item, format) => {
    // In real implementation, this would download from API
    console.log(`Downloading ${item.issueKey} as ${format}`)
  }

  const handleDelete = (id) => {
    console.log(`Deleting history item ${id}`)
  }

  return (
    <div className={`history ${darkMode ? 'dark' : 'light'}`}>
      <div className="history-container">
        <h3>📚 Test Plan History</h3>
        
        {historyItems.length === 0 ? (
          <div className="empty-state">
            <p>No test plans generated yet</p>
            <p className="hint">Go to Generate tab to create your first test plan</p>
          </div>
        ) : (
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Issue Key</th>
                  <th>Title</th>
                  <th>Generated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.map(item => (
                  <tr key={item.id} className={`status-${item.status}`}>
                    <td className="issue-key-cell">
                      <strong>{item.issueKey}</strong>
                    </td>
                    <td className="title-cell">{item.title}</td>
                    <td className="date-cell">{item.generatedDate}</td>
                    <td className="status-cell">
                      <span className={`badge ${item.status}`}>
                        {item.status === 'ready' ? '✅ Ready' : '⏰ Expired'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {item.status === 'ready' ? (
                        <div className="action-buttons">
                          <button
                            className="btn-small btn-download"
                            onClick={() => handleDownload(item, 'docx')}
                            title="Download DOCX"
                          >
                            📄
                          </button>
                          {item.format.includes('PDF') && (
                            <button
                              className="btn-small btn-download"
                              onClick={() => handleDownload(item, 'pdf')}
                              title="Download PDF"
                            >
                              📕
                            </button>
                          )}
                          <button
                            className="btn-small btn-delete"
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="info-box">
          <p>💡 Test plans are stored for 7 days before automatic deletion</p>
          <p>🔒 Only you can access your generated plans</p>
        </div>
      </div>
    </div>
  )
}
