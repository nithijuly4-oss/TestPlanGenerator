# SOP-006: Test Plan Generation Workflow (Layer 2 Navigation)

## 📋 Goal
Define the navigation/orchestration logic for generating a test plan from a Jira issue using LLM and template injection.

---

## 🎯 Input Requirements
- LLM connection status: Connected ✓
- Jira connection status: Connected ✓
- Jira issue data (fetched from SOP-005)
- Template schema (parsed from SOP-003)

---

## ⚙️ Navigation Logic

### Workflow: Generate Test Plan

```
User clicks "Generate Test Plan"
    ↓
Verify both connections cached?
    → LLM: No → Show error "Reconnect LLM"
    → Jira: No → Show error "Reconnect Jira"
    ↓
Show loading indicator: "Generating test plan..."
    ↓
Step 1: Call tools/generate_test_plan.py
        Input: {issue_data, template_schema, llm_endpoint}
        Output: {test_plan_sections}
    ↓
Step 2: Call tools/create_docx_plan.py
        Input: {template_path, generated_sections}
        Output: {docx_file_path}
    ↓
Step 3: Generate download metadata
        - Filename: "TestPlan_[ISSUE_KEY]_[DATE].docx"
        - Unique URL: [UUID]/docx
        - Expiry: 7 days
    ↓
Step 4: On user request "Export PDF"
        Call tools/export_pdf.py
        Input: {docx_file_path}
        Output: {pdf_file_path, pdf_url}
    ↓
Display Results:
  - Preview of test plan content
  - "Download DOCX" button (with link)
  - "Download PDF" button (with link)
  - "Share Link" button (with copy-to-clipboard)
  - "Generate Another" button
```

---

## 📤 Output Specification

### Generate Test Plan Response
```json
{
  "status": "success",
  "test_plan_id": "UUID",
  "issue_key": "SD-123",
  "generated_sections": {
    "title": "Test Plan for Add user authentication...",
    "objective": "Ensure user authentication...",
    "scope": "Login functionality...",
    "test_strategy": "1. Smoke testing...",
    "test_cases": [
      {
        "id": "TC-001",
        "title": "Valid login",
        "steps": "1. Enter email\n2. Enter password...",
        "expected": "User is logged in"
      }
    ],
    "risks": "Data breach if auth fails...",
    "approvals": "QA Lead, Dev Lead"
  },
  "files": {
    "docx": {
      "filename": "TestPlan_SD-123_20260328.docx",
      "url": "https://app.com/download/uuid-123/docx",
      "size_mb": 2.5,
      "created_at": "2026-03-28T19:30:00Z",
      "expires_at": "2026-04-04T19:30:00Z"
    },
    "pdf": null
  },
  "generation_time_seconds": 15
}
```

### Export PDF Response
```json
{
  "status": "success",
  "pdf": {
    "filename": "TestPlan_SD-123_20260328.pdf",
    "url": "https://app.com/download/uuid-123/pdf",
    "size_mb": 1.8,
    "created_at": "2026-03-28T19:31:00Z",
    "expires_at": "2026-04-04T19:31:00Z"
  }
}
```

---

## 🔄 Processing Steps

### 1. Prompt Generation (tools/generate_test_plan.py)
**Input:**
- Jira issue: title, description, acceptance criteria
- Template schema: section names and types
- Additional context: none (POC)

**Process:**
- Build context: "Generate test plan for: [ISSUE TITLE]"
- Call GROQ API with prompt
- Extract structured response (JSON)
- Validate all required sections present

**Output:**
- Test plan sections filled with LLM-generated content

### 2. DOCX Injection (tools/create_docx_plan.py)
**Input:**
- Template DOCX path
- Generated sections (from step 1)
- Issue metadata

**Process:**
- Load template DOCX
- Clone document structure
- Replace placeholders with generated content
- Preserve formatting/styles
- Add tables with data

**Output:**
- Save to `.tmp/[UUID].docx`
- Return file path + metadata

### 3. PDF Export (tools/export_pdf.py)
**Input:**
- DOCX file path

**Process:**
- Option A: python-pptx library
- Option B: LibreOffice headless conversion
- Convert DOCX → PDF
- Validate file is readable

**Output:**
- Save to `.tmp/[UUID].pdf`
- Return file path + metadata

---

## ✅ Success Criteria
- Test plan generated in < 30 seconds
- DOCX file created with all sections filled
- PDF export works (if requested)
- Files are downloadable
- All sections use formal language

---

## ❌ Failure Handling
| Issue | Cause | Action |
|-------|-------|--------|
| LLM rate limited | Too many requests | Queue + retry after 60s |
| Template not found | File missing | Log error, show user message |
| DOCX creation fails | Library error | Retry, fallback to plain text |
| PDF export fails | Conversion issue | Offer DOCX-only download |
| File too large | Memory limit | Offer to regenerate (smaller) |

---

## 🔒 Security & Privacy
- Files stored in `.tmp/` (ephemeral)
- Auto-delete after 7 days
- Download URLs are time-limited + unique (UUID-based)
- Do NOT expose file paths to user
