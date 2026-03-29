import { createContext, useState, useCallback } from 'react'

export const ConnectionContext = createContext()

export function ConnectionProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true)
  const [llmConnected, setLlmConnected] = useState(false)
  const [jiraConnected, setJiraConnected] = useState(false)
  const [llmModel, setLlmModel] = useState('openai/gpt-oss-120b')
  const [jiraInstance, setJiraInstance] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('connections')

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
    document.body.className = darkMode ? 'light-mode' : 'dark-mode'
  }, [darkMode])

  const updateError = useCallback((msg) => {
    setError(msg)
    if (msg) {
      setTimeout(() => setError(null), 5000)
    }
  }, [])

  const value = {
    darkMode,
    toggleDarkMode,
    llmConnected,
    setLlmConnected,
    jiraConnected,
    setJiraConnected,
    llmModel,
    setLlmModel,
    jiraInstance,
    setJiraInstance,
    loading,
    setLoading,
    error,
    updateError,
    activeTab,
    setActiveTab
  }

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  )
}
