import { useContext } from 'react'
import { ConnectionContext } from './context/ConnectionContext'
import { ConnectionSettings } from './components/ConnectionSettings'
import { GeneratePlan } from './components/GeneratePlan'
import { History } from './components/History'
import './App.css'

function App() {
  const context = useContext(ConnectionContext)
  const {
    darkMode,
    toggleDarkMode,
    activeTab,
    setActiveTab,
    error,
    llmConnected,
    jiraConnected
  } = context

  return (
    <div className={`app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>🚀 Test Plan Agent</h1>
            <p>Intelligent Test Planning with AI</p>
          </div>

          <div className="header-controls">
            <div className="status-indicator">
              {llmConnected && jiraConnected ? (
                <span className="status ready">
                  <span className="pulse"></span>
                  All Systems Ready
                </span>
              ) : (
                <span className="status pending">
                  <span className="pulse"></span>
                  Setup Required
                </span>
              )}
            </div>

            <button className="btn-theme" onClick={toggleDarkMode} title="Toggle theme">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => {}} className="close-btn">×</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="tab-nav">
        <button
          className={`tab-button ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          ⚙️ Connections
        </button>
        <button
          className={`tab-button ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
          disabled={!llmConnected || !jiraConnected}
        >
          ⚙️ Generate Plan
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📚 History
        </button>
      </nav>

      {/* Tab Content */}
      <main className="tab-content">
        {activeTab === 'connections' && <ConnectionSettings />}
        {activeTab === 'generate' && <GeneratePlan />}
        {activeTab === 'history' && <History />}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>🔐 Your data is secure and encrypted. Test plans stored for 7 days.</p>
      </footer>
    </div>
  )
}

export default App
