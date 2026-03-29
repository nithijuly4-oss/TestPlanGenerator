import { useState, useContext } from 'react'
import { ConnectionContext } from '../context/ConnectionContext'
import { apiClient } from '../api'
import './ConnectionSettings.css'

export function ConnectionSettings() {
  const context = useContext(ConnectionContext)
  const {
    llmConnected,
    setLlmConnected,
    jiraConnected,
    setJiraConnected,
    loading,
    setLoading,
    updateError,
    jiraInstance,
    setJiraInstance,
    darkMode
  } = context

  const [groqKey, setGroqKey] = useState('')
  const [jiraEmail, setJiraEmail] = useState('')
  const [jiraToken, setJiraToken] = useState('')

  const handleTestLLM = async () => {
    setLoading(true)
    try {
      const response = await apiClient.testLLMConnection(groqKey)
      if (response.data.status === 'connected') {
        setLlmConnected(true)
        updateError(null)
      } else {
        updateError(response.data.message || 'LLM connection failed')
        setLlmConnected(false)
      }
    } catch (error) {
      updateError(error.response?.data?.message || 'Failed to test LLM connection')
      setLlmConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const handleTestJira = async () => {
    setLoading(true)
    try {
      const response = await apiClient.testJiraConnection(jiraEmail, jiraToken, jiraInstance)
      if (response.data.status === 'connected') {
        setJiraConnected(true)
        setJiraInstance(response.data.user || response.data.user_email)
        updateError(null)
      } else {
        updateError(response.data.message || 'Jira connection failed')
        setJiraConnected(false)
      }
    } catch (error) {
      updateError(error.response?.data?.message || 'Failed to test Jira connection')
      setJiraConnected(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`connection-settings ${darkMode ? 'dark' : 'light'}`}>
      <div className="settings-container">
        {/* LLM Section */}
        <div className="settings-section">
          <h3>🧠 LLM Connection (GROQ)</h3>
          
          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_wGFCw8lz..."
              disabled={llmConnected}
            />
          </div>

          <div className="button-group">
            <button
              className={`btn btn-test ${llmConnected ? 'connected' : ''}`}
              onClick={handleTestLLM}
              disabled={loading || llmConnected}
            >
              {loading ? '⏳ Testing...' : llmConnected ? '✅ Connected' : '🔌 Test Connection'}
            </button>
            {llmConnected && (
              <button
                className="btn btn-reset"
                onClick={() => {
                  setLlmConnected(false)
                  setGroqKey('')
                }}
              >
                Reset
              </button>
            )}
          </div>

          {llmConnected && (
            <div className="status-message success">
              ✅ LLM (GROQ) Connected Successfully
            </div>
          )}
        </div>

        {/* Divider */}
        {llmConnected && (
          <>
            <div className="divider"></div>

            {/* Jira Section */}
            <div className="settings-section">
              <h3>🔗 Jira Cloud Connection</h3>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={jiraEmail}
                  onChange={(e) => setJiraEmail(e.target.value)}
                  placeholder="venkiikumar@gmail.com"
                  disabled={jiraConnected}
                />
              </div>

              <div className="form-group">
                <label>API Token</label>
                <input
                  type="password"
                  value={jiraToken}
                  onChange={(e) => setJiraToken(e.target.value)}
                  placeholder="ATATT3xFfGF0..."
                  disabled={jiraConnected}
                />
              </div>

              <div className="button-group">
                <button
                  className={`btn btn-test ${jiraConnected ? 'connected' : ''}`}
                  onClick={handleTestJira}
                  disabled={loading || jiraConnected || !llmConnected}
                >
                  {loading ? '⏳ Testing...' : jiraConnected ? '✅ Connected' : '🔌 Test Connection'}
                </button>
                {jiraConnected && (
                  <button
                    className="btn btn-reset"
                    onClick={() => {
                      setJiraConnected(false)
                      setJiraEmail('')
                      setJiraToken('')
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>

              {jiraConnected && (
                <div className="status-message success">
                  ✅ Jira Connected: {jiraInstance}
                </div>
              )}
            </div>
          </>
        )}

        {!llmConnected && (
          <div className="status-message info">
            🔒 Connect LLM first to unlock Jira connection
          </div>
        )}
      </div>
    </div>
  )
}
