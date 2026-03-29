# Test Planner Agent - API Documentation

## 🚀 Server Setup

### Prerequisites
- Node.js 16+ installed
- Python 3.8+ installed
- Dependencies installed via:
  ```bash
  npm install
  pip install -r requirements.txt
  ```

### Starting the Server
```bash
npm start        # Production mode
npm run dev      # Development mode (with --watch)
```

Server runs on: `http://localhost:3000`

---

## 📋 API Endpoints

### 1. Health Check
**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-28T19:45:00Z",
  "server": "Test Planner Agent API"
}
```

---

### 2. Test LLM Connection
**Endpoint:** `POST /api/connections/test-llm`

**Request Body:** (none)

**Response (Success):**
```json
{
  "status": "connected",
  "provider": "groq",
  "model": "openai/gpt-oss-120b",
  "message": "GROQ connection successful"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "provider": "groq",
  "message": "Authentication or configuration error: Invalid API key"
}
```

---

### 3. Test Jira Connection
**Endpoint:** `POST /api/connections/test-jira`

**Request Body:** (none)

**Response (Success):**
```json
{
  "status": "connected",
  "provider": "jira_cloud",
  "jira_instance": "atlassian",
  "user_email": "venkiikumar@gmail.com",
  "user_display_name": "venkateshkumar",
  "message": "Jira connection successful"
}
```

---

### 4. Get Connection Status
**Endpoint:** `GET /api/connections/status`

**Response:**
```json
{
  "llm": "connected",
  "jira": "connected",
  "timestamp": "2026-03-28T19:45:00Z"
}
```

---

### 5. Fetch Jira Issue
**Endpoint:** `GET /api/jira/issue/:issueKey`

**Parameters:**
- `issueKey` (path): e.g., "SD-123"

**Response (Found):**
```json
{
  "status": "found",
  "issue_key": "SD-123",
  "summary": "Add user authentication",
  "description": "Users should be able to log in...",
  "issue_type": "Story",
  "priority": "High",
  "acceptance_criteria": [
    "User can enter username/password",
    "System validates credentials"
  ]
}
```

**Response (Not Found):**
```json
{
  "status": "not_found",
  "issue_key": "SD-999",
  "message": "Issue SD-999 not found in Jira"
}
```

---

### 6. Generate Test Plan
**Endpoint:** `POST /api/test-plan/generate`

**Request Body:**
```json
{
  "issueTitle": "Add user authentication",
  "issueDescription": "Users should be able to log in to the system",
  "acceptanceCriteria": [
    "User can enter username/password",
    "System validates credentials",
    "User is logged in on success"
  ]
}
```

**Response (Success):**
```json
{
  "status": "success",
  "sections": {
    "objective": "Ensure user authentication...",
    "scope": "Login functionality...",
    "test_cases": [
      {
        "id": "TC-001",
        "title": "Valid login",
        "steps": "1. Enter email\n2. Enter password\n3. Click login",
        "expected_result": "User is logged in"
      }
    ]
  },
  "model_used": "openai/gpt-oss-120b"
}
```

---

### 7. Create DOCX Test Plan
**Endpoint:** `POST /api/test-plan/create-docx`

**Request Body:**
```json
{
  "issueKey": "SD-123",
  "issueTitle": "Add user authentication",
  "testPlanSections": {
    "objective": "Ensure authentication works...",
    "scope": "Login page testing",
    "test_cases": [
      {
        "id": "TC-001",
        "title": "Valid login",
        "steps": "1. Enter email\n2. Enter password",
        "expected_result": "User logged in"
      }
    ]
  }
}
```

**Response (Success):**
```json
{
  "status": "success",
  "file_path": ".tmp/8a3f5b2c_SD-123_TestPlan.docx",
  "file_name": "8a3f5b2c_SD-123_TestPlan.docx",
  "file_id": "8a3f5b2c",
  "file_size_kb": 125.5
}
```

---

### 8. Export to PDF
**Endpoint:** `POST /api/test-plan/export-pdf`

**Request Body:**
```json
{
  "docxFilePath": ".tmp/8a3f5b2c_SD-123_TestPlan.docx"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "pdf_path": ".tmp/8a3f5b2c_SD-123_TestPlan.pdf",
  "pdf_name": "8a3f5b2c_SD-123_TestPlan.pdf",
  "file_size_kb": 98.3
}
```

---

### 9. Download File
**Endpoint:** `GET /api/download/:fileId?format=docx|pdf`

**Parameters:**
- `fileId` (path): File identifier (includes issue key, etc.)
- `format` (query): "docx" or "pdf"

**Response:** File download (binary)

---

## 🔄 Workflow Example

### Complete Test Plan Generation Flow

```
1. POST /api/connections/test-llm
   → Verify LLM is connected

2. POST /api/connections/test-jira
   → Verify Jira is connected

3. GET /api/jira/issue/SD-123
   → Fetch issue details

4. POST /api/test-plan/generate
   → Generate test plan content using LLM

5. POST /api/test-plan/create-docx
   → Inject content into template DOCX

6. POST /api/test-plan/export-pdf (optional)
   → Convert DOCX to PDF

7. GET /api/download/fileId?format=docx
   → Download file
```

---

## ⚠️ Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 200 | OK | Request successful |
| 400 | Bad Request | Missing required fields or invalid input |
| 404 | Not Found | Resource not found (e.g., Jira issue, file) |
| 500 | Internal Server Error | Server error (check logs) |

---

## 🔒 Security Notes

- API keys stored in `.env` file (never commit)
- Connection state cached in-memory for 30 minutes
- Download URLs do NOT expose file paths
- Files auto-deleted after 7 days (configurable)

---

## 🛠️ Troubleshooting

### LLM Connection Error
```
"Authentication or configuration error: Invalid API key"
```
**Solution:** Check `GROQ_API_KEY` in `.env`

### Jira Connection Error
```
"Jira authentication failed (invalid credentials)"
```
**Solution:** Check `JIRA_EMAIL` and `JIRA_API_TOKEN` in `.env`

### Python Tool Error
```
"Python tool failed: [error message]"
```
**Solution:** Verify Python dependencies: `pip install -r requirements.txt`

### PDF Export Error
```
"PDF conversion not available. Please install LibreOffice"
```
**Solution:** Install LibreOffice (Windows/Mac/Linux)

---

## 📝 Development Notes

- Backend runs on Node.js with Express
- Python tools are called via `child_process.spawn()`
- All responses are JSON
- CORS enabled for frontend requests

---

**API Version:** 1.0  
**Last Updated:** March 28, 2026
