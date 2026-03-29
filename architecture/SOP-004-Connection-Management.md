# SOP-004: Connection Management Workflow (Layer 2 Navigation)

## 📋 Goal
Define the navigation/orchestration logic for managing LLM and Jira connections, including validation, caching, and error recovery.

---

## 🎯 Input Requirements
- User-provided LLM credentials (API key)
- User-provided Jira credentials (email + API token)
- Connection states to manage and validate

---

## ⚙️ Navigation Logic

### Workflow: Save & Test LLM Connection

```
User Input (API Key)
    ↓
Validate format (length, allowed chars)
    ↓
Call tools/test_groq_connection.py
    ↓
Response: {"status": "connected" | "error", ...}
    ↓
If Connected:
  → Store in session/cache (30-min TTL)
  → Return success + hide Jira setup
  → Update UI: "LLM Connected ✓"
  ↓
If Error:
  → Return error message
  → Allow retry
  → Do NOT show Jira setup yet
```

### Workflow: Save & Test Jira Connection

```
User Input (Email + API Token)
    ↓
Validate format (email contains @, token length)
    ↓
Get JIRA URL from config/.env
    ↓
Call tools/test_jira_connection.py
    ↓
Response: {"status": "connected" | "error", ...}
    ↓
If Connected:
  → Store in session/cache (30-min TTL)
  → Return success + unlock Step 3
  → Return user info (email, name)
  → Update UI: "Jira Connected ✓"
  ↓
If Error:
  → Return error message
  → Allow retry
  → Do NOT unlock Step 3 yet
```

### Workflow: Connection Status Check

```
On App Load:
    ↓
Check session cache:
    - LLM connected? → Show Jira setup
    - Jira connected? → Show Step 3 (Fetch Issues)
    ↓
If no cache (session expired):
    - Hide Jira setup
    - Show LLM setup
    - Require re-authentication
```

---

## 📤 Output Specification

### Set LLM Connection Response
```json
{
  "success": true,
  "provider": "groq",
  "model": "openai/gpt-oss-120b",
  "message": "LLM connection established",
  "cache_ttl_seconds": 1800
}
```

### Set Jira Connection Response
```json
{
  "success": true,
  "provider": "jira_cloud",
  "user_email": "venkiikumar@gmail.com",
  "user_name": "venkateshkumar",
  "message": "Jira connection established",
  "cache_ttl_seconds": 1800
}
```

### Error Response
```json
{
  "success": false,
  "error_code": "string (e.g., 'INVALID_API_KEY')",
  "error_message": "Human-readable error",
  "retry_count": "integer",
  "recoverable": true | false
}
```

---

## 🔄 State Management
- Store connection state in server-side session or in-memory cache
- TTL: 30 minutes
- On cache expiry: require re-authentication
- On new connection: invalidate old cache

---

## ✅ Success Criteria
- Both connections can be tested independently
- Connection state is properly cached
- UI reflects connection status correctly
- Workflow steps unlock in correct order

---

## ❌ Failure Handling
- Invalid credentials → Show user-friendly error
- Network timeout → Offer retry button
- Rate limit (429) → Show wait message + retry automatically
- Session expired → Ask user to re-authenticate
