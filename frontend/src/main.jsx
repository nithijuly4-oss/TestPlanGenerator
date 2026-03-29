import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConnectionProvider } from './context/ConnectionContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConnectionProvider>
      <App />
    </ConnectionProvider>
  </React.StrictMode>
)
