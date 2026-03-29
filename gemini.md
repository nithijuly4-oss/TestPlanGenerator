# Test Planner Agent - Project Constitution

## 🗺️ Project Map & State Tracking

### Project Identity
**Name:** Intelligent Test Plan Creator  
**Framework:** B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger)  
**Architecture:** A.N.T. 3-Layer (Architecture SOPs, Navigation Logic, Tools)  
**Phase:** 1 - Blueprint (Awaiting Discovery Answers)

---

## 📊 Data Schema (CONFIRMED)

### 1. LLM Connection Configuration
```json
{
  "llm_provider": "enum: ['groq']",
  "llm_model": "string (e.g., 'openai/gpt-oss-120b')",
  "api_key": "string (encrypted)",
  "status": "enum: ['connected', 'disconnected', 'error']"
}
```

### 2. Jira Connection Configuration
```json
{
  "jira_endpoint": "string (Jira Cloud URL)",
  "jira_email": "string (user email)",
  "jira_api_token": "string (encrypted)",
  "status": "enum: ['connected', 'disconnected', 'error']"
}
```

### 3. Test Plan Generation Request
```json
{
  "jira_id": "string (e.g., 'PROJ-123')",
  "llm_provider": "string (groq)",
  "additional_context": "null (not used in POC)",
  "export_format": "enum: ['docx', 'pdf', 'both']"
}
```

### 4. Test Plan Output
```json
{
  "test_plan_id": "string (UUID)",
  "jira_id": "string",
  "story_title": "string",
  "story_description": "string",
  "test_plan_content": "object (follows template structure)",
  "generated_at": "ISO 8601 timestamp",
  "llm_model_used": "string",
  "export_files": {
    "docx_url": "string (download link)",
    "pdf_url": "string (download link)"
  }
}
```

---

## ⚙️ Behavioral Rules (CONFIRMED)

- [x] LLM connection MUST be tested successfully before Jira connection setup appears
- [x] Jira connection MUST be tested successfully before Step 3 (Jira ID selection)
- [x] Test plans MUST follow the exact template structure from Test Plan - Template.docx
- [x] All generated content uses FORMAL language
- [x] Export formats: Both DOCX and PDF supported
- [x] Sharing: Download link (temporary cloud storage)
- [x] Do NOT modify Jira status or auto-comment
- [x] Do NOT expose API keys in logs or UI
- [x] All connections include "Test Connection" button
- [x] No additional context fields in POC

---

## 🔌 Connection Configuration (CONFIRMED)

### LLM Service Connection
- **Provider:** GROQ
- **Model:** openai/gpt-oss-120b
- **Auth:** API Key
- **Test Button:** Verify connectivity & model availability
- **UI:** Dropdown to select provider, text field for API key, test button, status indicator

### Jira Service Connection
- **Endpoint:** Jira Cloud (user provides URL)
- **Auth:** API Token + Email
- **Test Button:** Verify connectivity & fetch test Jira ID
- **UI:** Email field, API token field, test button, status indicator
- **Credentials:** User confirms they are ready

---

## 🛠️ Implementation Details (CONFIRMED)

### Backend Stack
- **Framework:** Node.js (Express or similar)
- **API Calls Retry Logic:** 3 retries maximum
- **Retry Delay:** Exponential backoff (default 2s)

### File Management
- **Storage Location:** Local `.tmp/` folder
- **Export Formats:** DOCX (via python-docx) + PDF (via pypdf)
- **Download Link Validity:** 7 days
- **Cleanup:** Auto-delete files after 7 days

### UI/UX Configuration
- **Framework:** React
- **Layout:** Tab-based (Connections, Generate, History)
- **Dark Mode:** Standard dark mode (default colors)
- **Light Mode:** Standard light mode
- **Responsive:** Mobile-friendly design

---

## 🧠 Review Checkpoints
- [x] Phase 1 Blueprint approved
- [x] Data schema finalized
- [x] Workflow steps locked in
- [x] Implementation details confirmed
- [x] **PHASE 2: Link - 100% PASSED**
  - [x] GROQ connectivity verified
  - [x] Jira connectivity verified
  - [x] Template parsed (24 sections)
- [x] **PHASE 3: Architect - 100% COMPLETE**
  - [x] Layer 2 Navigation (3 SOPs)
  - [x] Layer 3 Tools (5 tools)
  - [x] Express API (9 routes)
  - [x] Server running on port 3000
- [ ] **PHASE 4: Stylize (React Frontend - ready to begin)**

---

## � Workflow Steps (CONFIRMED)

### Step 1: LLM Connection Setup
1. User opens settings/setup page
2. Dropdown to select LLM provider (currently GROQ only)
3. Enter API Key
4. Click "Test Connection" button
5. On success → show green checkmark & proceed to Jira setup
6. On failure → show error message & allow retry

### Step 2: Jira Connection Setup
1. Display only after LLM connection succeeds
2. User enters Jira Email address
3. User enters Jira API Token
4. Click "Test Connection" button
5. On success → show green checkmark & proceed to Step 3
6. On failure → show error message & allow retry

### Step 3: Fetch & Preview Jira Content
1. Display only after Jira connection succeeds
2. User selects/enters Jira ID (e.g., "PROJ-123")
3. Click "Fetch" or "Preview" button
4. Display Jira story content:
   - Story Title
   - Story Description
   - Acceptance Criteria
   - Any other relevant fields from Jira
5. User can proceed to Step 4 or go back

### Step 4: Generate Test Plan
1. Click "Generate Test Plan" button
2. Show loading indicator with progress
3. LLM processes story content using template structure
4. Generate test plan following exact format from Test Plan - Template.docx
5. Display preview in UI
6. Provide export options:
   - Download as DOCX
   - Download as PDF
   - Download Both (DOCX + PDF in ZIP)
7. Share option: Generate download link (with expiry)

---

## 📝 Maintenance Log
**Current Status:** Phase 1 Blueprint CONFIRMED - Ready for Phase 2 (Link)

**Approved By:** User  
**Date Approved:** March 28, 2026

**Key Decisions:**
- ✅ GROQ as primary LLM provider
- ✅ Jira Cloud integration
- ✅ Test connection buttons mandatory
- ✅ Export both DOCX and PDF
- ✅ Share via download link
- ✅ Formal language requirement
- ✅ React UI with light/dark mode
