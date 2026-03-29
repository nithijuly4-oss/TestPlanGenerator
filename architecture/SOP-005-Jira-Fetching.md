# SOP-005: Jira Issue Fetching Workflow (Layer 2 Navigation)

## 📋 Goal
Define the navigation/orchestration logic for fetching and displaying Jira issue details before test plan generation.

---

## 🎯 Input Requirements
- Jira connection status: Connected ✓
- Jira issue key or ID (e.g., "PROJ-123")
- Jira API credentials (cached from SOP-004)

---

## ⚙️ Navigation Logic

### Workflow: Fetch & Display Jira Issue

```
User enters Jira ID (e.g., "PROJ-123")
    ↓
Validate format (not empty, alphanumeric)
    ↓
Check Jira connection cached? 
    → No: Show error "Jira not connected"
    → Yes: Continue
    ↓
Call tools/fetch_jira_issue.py with ID
    ↓
Response: {"status": "found" | "not_found" | "error", ...}
    ↓
If Found:
  → Display in preview:
    - Issue Key (e.g., "SD-123")
    - Summary/Title
    - Description
    - Acceptance Criteria (if available)
    - Issue Type, Status, Priority
    - Story Points (if available)
  → Show "Generate Test Plan" button
  ↓
If Not Found:
  → Show error "Issue PROJ-123 not found"
  → Allow retry with different ID
  ↓
If Error:
  → Show error message
  → Offer connection re-check
```

---

## 📤 Output Specification

### Fetch Issue Response
```json
{
  "status": "found",
  "issue_key": "SD-123",
  "summary": "Add user authentication to login page",
  "description": "Users should be able to log in...",
  "issue_type": "Story",
  "priority": "High",
  "status": "In Progress",
  "acceptance_criteria": [
    "User can enter email/password",
    "System validates credentials",
    "User is logged in on success"
  ],
  "story_points": 5,
  "labels": ["auth", "web"],
  "created": "2026-03-01T10:00:00Z",
  "raw_json": {}
}
```

### Not Found Response
```json
{
  "status": "not_found",
  "issue_key": "PROJ-999",
  "message": "Issue PROJ-999 not found in Jira",
  "suggestion": "Check issue key and try again"
}
```

---

## 🔄 Caching & Performance
- Cache fetched issues for 10 minutes
- If same issue requested: return cached version
- Show "Cached" indicator if from cache
- Include cache expiry timestamp

---

## ✅ Success Criteria
- Issue details fetched successfully
- All key fields extracted (title, description, acceptance criteria)
- Display is user-friendly and complete
- Ready to generate test plan from this data

---

## ❌ Failure Handling
| Issue | Cause | Action |
|-------|-------|--------|
| Jira not connected | Session expired | Ask user to reconnect Jira |
| Issue not found | Invalid key | Suggest similar issues or help |
| Rate limited (429) | Too many calls | Retry after delay |
| Network error | Connection problem | Offer retry |
| Parsing error | Invalid response | Log error, show generic message |
