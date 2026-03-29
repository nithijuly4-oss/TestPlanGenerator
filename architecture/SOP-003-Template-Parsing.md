# SOP-003: DOCX Template Parsing

## 📋 Goal
Parse the test plan template DOCX file to extract structure, sections, and placeholders for dynamic content generation.

---

## 🎯 Input Requirements
- `template_path`: String - Path to `Test Plan - Template.docx`
- Expected location: `./test_plan_templat/Test Plan - Template.docx`

---

## ⚙️ Tool Logic

### Step 1: Extract DOCX Structure
- Open DOCX as XML archive
- Extract all paragraphs, tables, and formatting
- Identify section headings (Heading 1, Heading 2, etc.)
- Map placeholders (e.g., `{{PROJECT_NAME}}`, `{{TEST_CASES}}`)

### Step 2: Identify Dynamic Sections
- **Static Sections:** Content that remains unchanged (headers, footers, intro text)
- **Dynamic Sections:** Content to be populated from Jira story
  - Project Name
  - Feature Description
  - Acceptance Criteria
  - Test Cases
  - Risk Assessment
  - Expected Results
  - etc.

### Step 3: Create Template Schema
- Map section name → placeholder variable
- Document expected data type (string, list, table)
- Specify character/word limits if any
- Track formatting requirements (bullets, numbered lists, tables)

### Step 4: Verify Template Integrity
- Check that all required sections exist
- Validate no critical placeholders are missing
- **Edge Case:** Corrupted DOCX → Return error with location info
- **Edge Case:** Missing sections → Log warning, document missing content

---

## 📤 Output Specification
```json
{
  "status": "valid" | "invalid" | "error",
  "template_name": "Test Plan - Template.docx",
  "sections": [
    {
      "name": "string (section title)",
      "placeholder": "string (e.g., 'FEATURE_DESCRIPTION')",
      "type": "string | list | table",
      "required": "boolean",
      "character_limit": "integer or null"
    }
  ],
  "total_sections": "integer",
  "message": "string (status message)",
  "timestamp": "ISO 8601"
}
```

---

## ✅ Success Criteria
- ✓ DOCX file opens without errors
- ✓ All sections are readable
- ✓ Template structure is valid
- ✓ Placeholder map is complete
- ✓ Can be used for test plan generation

---

## ❌ Failure Handling
| Issue | Cause | Action |
|-------|-------|--------|
| file_not_found | Template missing | Return error, ask user to verify path |
| corrupted_docx | File is damaged | Return error, suggest re-uploading |
| invalid_format | Not a valid DOCX | Return error, ask for .docx file |
| missing_sections | Key sections absent | Log warning, document missing parts |

---

## 🛠️ Implementation Notes
- Use `python-docx` library for parsing
- Extract text, tables, and styling information
- Cache parsed template schema (60-min TTL)
- Create a schema JSON file in `.tmp/` for reference
- This is a one-time operation per template version
- Document any deviations from expected structure
