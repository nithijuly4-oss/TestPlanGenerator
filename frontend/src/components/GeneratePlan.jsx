import { useState, useContext } from 'react'
import { ConnectionContext } from '../context/ConnectionContext'
import { apiClient } from '../api'
import './GeneratePlan.css'

export function GeneratePlan() {
  const context = useContext(ConnectionContext)
  const {
    llmConnected,
    jiraConnected,
    loading,
    setLoading,
    updateError,
    darkMode
  } = context

  const [issueKey, setIssueKey] = useState('')
  const [issue, setIssue] = useState(null)
  const [testPlan, setTestPlan] = useState(null)
  const [step, setStep] = useState(0) // 0: input, 1: fetching, 2: generating, 3: complete

  const handleFetchIssue = async () => {
    if (!issueKey.trim()) {
      updateError('Please enter a Jira issue key')
      return
    }

    setLoading(true)
    setStep(1)
    try {
      const response = await apiClient.fetchJiraIssue(issueKey)
      console.log('🔍 API Response:', response.data)
      console.log('📊 Response Status:', response.data.status)
      
      if (response.data.status === 'found') {
        console.log('✅ Issue found:', response.data)
        setIssue(response.data)
        setStep(0) // Back to ready for generation
      } else {
        console.warn('❌ Issue not found in response:', response.data)
        updateError(response.data.message || 'Issue not found')
        setIssue(null) // Clear issue state if not found
        setStep(0)
      }
    } catch (error) {
      console.error('❌ Fetch error:', error)
      updateError(error.response?.data?.message || 'Failed to fetch issue')
      setIssue(null) // Clear issue state on error
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateTestPlan = async () => {
    if (!issue) return

    setLoading(true)
    setStep(2)
    try {
      const response = await apiClient.generateTestPlan(
        issue.summary || issue.title,
        issue.description || '',
        issue.acceptance_criteria || []
      )
      setTestPlan(response.data)
      setStep(3)
    } catch (error) {
      updateError(error.response?.data?.message || 'Failed to generate test plan')
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format) => {
    if (!testPlan) return
    
    // Get the test plan data from either sections or test_plan property
    const testPlanData = testPlan.sections || testPlan.test_plan || testPlan
    
    setLoading(true)
    try {
      if (format === 'docx') {
        // Try direct download endpoint first (Vercel-optimized, no disk storage)
        try {
          console.log('Using direct download endpoint...')
          const response = await apiClient.downloadDocxDirect(
            issueKey,
            issue.summary || issue.title,
            testPlanData
          )
          
          const url = URL.createObjectURL(response.data)
          const link = document.createElement('a')
          link.href = url
          link.download = `${issueKey}_TestPlan.docx`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          setLoading(false)
          updateError('')
          console.log('Document downloaded successfully!')
          return
        } catch (directError) {
          console.log('Direct download failed, trying legacy method...', directError)
          // Fallback to legacy method
        }
        
        // Fallback: Create DOCX then download
        const docxResponse = await apiClient.createDocxPlan(
          issueKey,
          issue.summary || issue.title,
          testPlanData
        )

        if (!docxResponse.data || !docxResponse.data.file_id) {
          throw new Error('Failed to create document')
        }

        const fileBlob = await apiClient.downloadFile(docxResponse.data.file_id, 'docx')
        const url = URL.createObjectURL(fileBlob.data)
        const a = document.createElement('a')
        a.href = url
        a.download = `${issueKey}_TestPlan.docx`
        a.click()
        URL.revokeObjectURL(url)
        setLoading(false)
        updateError('')
      } else if (format === 'pdf') {
        // PDF export
        const docxResponse = await apiClient.createDocxPlan(
          issueKey,
          issue.summary || issue.title,
          testPlanData
        )

        if (!docxResponse.data || !docxResponse.data.file_id) {
          throw new Error('Failed to create document')
        }

        try {
          const pdfResponse = await apiClient.exportPDF(docxResponse.data.file_path)
          
          const fileBlob = await apiClient.downloadFile(docxResponse.data.file_id, 'pdf')
          const url = URL.createObjectURL(fileBlob.data)
          const a = document.createElement('a')
          a.href = url
          a.download = `${issueKey}_TestPlan.pdf`
          a.click()
          URL.revokeObjectURL(url)
          setLoading(false)
          updateError('')
        } catch (pdfError) {
          setLoading(false)
          updateError('PDF conversion not available. Please use DOCX format. (LibreOffice required for PDF conversion)')
        }
      }
    } catch (error) {
      setLoading(false)
      updateError(error.response?.data?.message || error.message || `Failed to export ${format.toUpperCase()}`)
    }
  }

  if (!llmConnected || !jiraConnected) {
    return (
      <div className={`generate-plan ${darkMode ? 'dark' : 'light'}`}>
        <div className="warning-box">
          <p>⚠️ Please complete connection setup first</p>
          <p>Both LLM and Jira connections required</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`generate-plan ${darkMode ? 'dark' : 'light'}`}>
      <div className="plan-container">
        {/* Input Section - Only show if no issue has been fetched yet */}
        {!issue && step === 0 && (
          <div className="section">
            <h3>Step 1: Fetch Jira Issue</h3>
            <div className="input-group">
              <input
                type="text"
                value={issueKey}
                onChange={(e) => setIssueKey(e.target.value.toUpperCase())}
                placeholder="e.g., PROJ-123"
                onKeyPress={(e) => e.key === 'Enter' && handleFetchIssue()}
              />
              <button
                className="btn btn-primary"
                onClick={handleFetchIssue}
                disabled={loading || !issueKey.trim()}
              >
                Fetch Issue
              </button>
            </div>
          </div>
        )}

        {/* Fetching State */}
        {step === 1 && (
          <div className="section loading">
            <div className="spinner"></div>
            <p>Fetching issue details...</p>
          </div>
        )}

        {/* Issue Display */}
        {issue && (
          <div className="section issue-display">
            <h3>Issue Details</h3>
            <div className="issue-card">
              <div className="issue-key">{issue.key}</div>
              <h4>{issue.summary || issue.title}</h4>
              <p className="description">{issue.description || '(No description)'}</p>
              {issue.acceptance_criteria && issue.acceptance_criteria.length > 0 && (
                <div className="criteria">
                  <strong>Acceptance Criteria:</strong>
                  <ul>
                    {issue.acceptance_criteria.map((criterion, idx) => (
                      <li key={idx}>{criterion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {step === 2 && (
              <div className="loading-inline">
                <div className="spinner-small"></div>
                <span>Generating test plan...</span>
              </div>
            )}

            {!loading && (
              <button
                className="btn btn-primary"
                onClick={handleGenerateTestPlan}
                disabled={loading}
              >
                {testPlan ? 'Regenerate' : 'Generate Test Plan'}
              </button>
            )}

            {/* Option to fetch a different issue */}
            <button
              className="btn btn-secondary"
              onClick={() => {
                setIssue(null)
                setTestPlan(null)
                setIssueKey('')
                setStep(0)
              }}
              disabled={loading}
              style={{ marginLeft: '10px' }}
            >
              Fetch Different Issue
            </button>
          </div>
        )}

        {/* Test Plan Display */}
        {testPlan && step === 3 && (
          <div className="section test-plan-display">
            <h3>Generated Test Plan</h3>
            <div className="test-plan-card">
              {(testPlan.sections || testPlan.test_plan) && (
                <>
                  {(testPlan.sections?.objective || testPlan.test_plan?.objective) && (
                    <div className="section-content">
                      <h5>📋 Objective</h5>
                      <p>{testPlan.sections?.objective || testPlan.test_plan?.objective}</p>
                    </div>
                  )}

                  {(testPlan.sections?.scope || testPlan.test_plan?.scope) && (
                    <div className="section-content">
                      <h5>📌 Scope</h5>
                      <p>{testPlan.sections?.scope || testPlan.test_plan?.scope}</p>
                    </div>
                  )}

                  {(testPlan.sections?.test_cases || testPlan.test_plan?.test_cases) && (testPlan.sections?.test_cases || testPlan.test_plan?.test_cases).length > 0 && (
                    <div className="section-content">
                      <h5>🧪 Test Cases</h5>
                      <ul>
                        {(testPlan.sections?.test_cases || testPlan.test_plan?.test_cases).map((tc, idx) => (
                          <li key={idx}>
                            <strong>{tc.title || `Test ${idx + 1}`}:</strong> {tc.steps || tc.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(testPlan.sections?.entry_criteria || testPlan.test_plan?.entry_criteria) && (
                    <div className="section-content">
                      <h5>✓ Entry Criteria</h5>
                      <p>{testPlan.sections?.entry_criteria || testPlan.test_plan?.entry_criteria}</p>
                    </div>
                  )}

                  {(testPlan.sections?.exit_criteria || testPlan.test_plan?.exit_criteria) && (
                    <div className="section-content">
                      <h5>✓ Exit Criteria</h5>
                      <p>{testPlan.sections?.exit_criteria || testPlan.test_plan?.exit_criteria}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="export-buttons">
              <button
                className="btn btn-export"
                onClick={() => handleExport('docx')}
                disabled={loading}
              >
                📄 Export DOCX
              </button>
              <button
                className="btn btn-export"
                onClick={() => handleExport('pdf')}
                disabled={loading}
              >
                📕 Export PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
