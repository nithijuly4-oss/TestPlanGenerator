import axios from 'axios'

const API_BASE = '/api'

export const apiClient = {
  // Health check
  async getHealth() {
    return axios.get(`${API_BASE}/health`)
  },

  // Connection tests
  async testLLMConnection() {
    return axios.post(`${API_BASE}/connections/test-llm`)
  },

  async testJiraConnection() {
    return axios.post(`${API_BASE}/connections/test-jira`)
  },

  async getConnectionStatus() {
    return axios.get(`${API_BASE}/connections/status`)
  },

  // Jira operations
  async fetchJiraIssue(issueKey) {
    return axios.get(`${API_BASE}/jira/issue/${issueKey}`)
  },

  // Test plan operations
  async generateTestPlan(issueTitle, issueDescription, acceptanceCriteria = []) {
    return axios.post(`${API_BASE}/test-plan/generate`, {
      issueTitle,
      issueDescription,
      acceptanceCriteria
    })
  },

  async createDocxPlan(issueKey, issueTitle, testPlanSections) {
    return axios.post(`${API_BASE}/test-plan/create-docx`, {
      issueKey,
      issueTitle,
      testPlanSections
    })
  },

  async downloadDocxDirect(issueKey, issueTitle, testPlanSections) {
    // Direct download endpoint - optimal for serverless environments
    return axios.post(`${API_BASE}/test-plan/download-docx`, {
      issueKey,
      issueTitle,
      testPlanSections
    }, {
      responseType: 'blob'
    })
  },

  async exportPDF(docxFilePath) {
    return axios.post(`${API_BASE}/test-plan/export-pdf`, {
      docxFilePath
    })
  },

  async downloadFile(fileId, format = 'docx') {
    return axios.get(`${API_BASE}/download/${fileId}?format=${format}`, {
      responseType: 'blob'
    })
  }
}
