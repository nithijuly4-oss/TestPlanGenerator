# SOP-002: Jira Cloud API Connection & Test

## 📋 Goal
Establish and verify a reliable connection to Jira Cloud API using email + API token authentication, and validate access to the target Jira instance.

---

## 🎯 Input Requirements
- `JIRA_CLOUD_URL`: String (from .env) - e.g., `https://venkateshkumar.atlassian.net`
- `JIRA_EMAIL`: String (from .env) - e.g., `venkiikumar@gmail.com`
- `JIRA_API_TOKEN`: String (from .env) - API token generated in Jira

---

## ⚙️ Tool Logic

### Step 1: Parse & Validate Jira URL
- Extract protocol (https) and domain from URL
- Validate format: `https://[instance].atlassian.net` or similar
- Remove trailing slashes
- Normalized URL pattern: `https://[instance].atlassian.net/rest/api/3`

### Step 2: Build Authorization Headers
- Create Basic Auth header: `base64(email:api_token)`
- Header format: `Authorization: Basic [base64_encoded_credentials]`
- Do NOT log credentials; only log "Authorization header set"

### Step 3: Test API Connection
- Send HTTP GET request to: `{JIRA_URL}/rest/api/3/myself`
- **Purpose:** Verify authentication & user permissions
- Timeout: 10 seconds
- Expected Status: 200 OK

### Step 4: Parse Response
- Extract user profile info (email, displayName, accountId)
- Verify email matches configured JIRA_EMAIL
- **Edge Case:** Email mismatch → Warn but allow (user may have multiple accounts)
- **Edge Case:** User lacks permissions → Return error with permission guidance

### Step 5: Verify Project Access (Optional)
- Query `/rest/api/3/project/search?expand=1` with limit 1
- Purpose: Confirm user can access at least one project
- Not critical but helpful for validation

---

## 📤 Output Specification
```json
{
  "status": "connected" | "disconnected" | "error",
  "provider": "jira_cloud",
  "jira_instance": "string (instance name)",
  "user_email": "string",
  "user_display_name": "string",
  "account_id": "string",
  "message": "string (human-readable status)",
  "timestamp": "ISO 8601",
  "retry_count": "integer (0-3)"
}
```

---

## 🔄 Retry Logic
- Max Retries: 3
- Initial Delay: 2 seconds
- Backoff Strategy: Exponential (2s → 4s → 8s)
- Retry on: 429 (rate limit), 5xx errors, timeout
- Do NOT retry on: 401 (auth failure), 403 (permission denied)

---

## ✅ Success Criteria
- ✓ Basic Auth header properly constructed
- ✓ `/rest/api/3/myself` endpoint returns 200 OK
- ✓ Authenticated user email matches JIRA_EMAIL
- ✓ User has project access
- ✓ All in < 15 seconds

---

## ❌ Failure Handling
| Error Code | Cause | Action |
|-----------|-------|--------|
| 401 | Invalid credentials (email/token) | Return error, do NOT retry |
| 403 | User lacks permission | Return error with details |
| 429 | Rate limited | Retry with exponential backoff |
| 5xx | Jira server error | Retry with exponential backoff |
| timeout | Network/DNS issue | Retry with exponential backoff |
| invalid_url | Malformed Jira URL | Return error, ask user to verify |

---

## 🛠️ Implementation Notes
- Use `requests` library (Python) or `axios` (Node.js)
- ALWAYS use HTTPS; never allow HTTP
- Implement certificate verification (SSL)
- Cache connection result (30-min TTL)
- Log connection attempts with timestamp, do NOT log credentials
- Test button should return full result object to UI
- Provide helpful error messages for troubleshooting (e.g., "Check API token expiry in Jira account settings")
