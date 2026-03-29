# Test Planner Agent - Task Plan

## 🎯 Project Overview
Build an intelligent test planner agent that fetches Jira user stories and generates test plans using an LLM connection (Ollama/GROQ/Grok) and a React UI with dark mode support.

---

## 📋 Phase Checklist

## 🎯 Phase 1: Blueprint (Vision & Logic) ✅ COMPLETE
- [x] Answer 5 Discovery Questions
- [x] Define Data Schema in `gemini.md`
- [x] Map LLM connection (GROQ API, openai/gpt-oss-120b model)
- [x] Define test plan template structure
- [x] Define Jira integration scope (Cloud, API key auth)
- [x] Lock workflow steps (Step 1→4)
- [x] Define sharing & export (download link, DOCX+PDF)

**Status:** ✅ APPROVED

### Phase 2: Link (Connectivity) ✅ COMPLETE
- [x] Test LLM connection (GROQ - ✅ Connected)
- [x] Test Jira API connection (✅ Connected)
- [x] Verify test plan template parsing (✅ 24 sections parsed)
- [x] Create test tools in `tools/`
- [x] Create SOPs in `architecture/`

**Status:** ✅ ALL TESTS PASSED

### Phase 3: Architect (3-Layer Build) ✅ COMPLETE
- [x] Layer 2 Navigation SOPs (SOP-004, SOP-005, SOP-006)
- [x] Python tools (5 tools created + tested)
- [x] Node.js Express backend (server.js)
- [x] 9 API route handlers
- [x] Connection state management
- [x] API documentation
- [x] Dependencies installed
- [x] Server verified on port 3000

**Status:** ✅ PHASE 3 COMPLETE

### Phase 4: Stylize (Refinement & UI) 🔄 NEXT
- [ ] Set up React project
- [ ] Tab-based layout (Connections, Generate, History)
- [ ] Connection settings UI
- [ ] Issue search/fetch UI
- [ ] Test plan preview
- [ ] Light/dark mode support
- [ ] Download/share functionality

### Phase 5: Trigger (Deployment)
- [ ] Deploy to cloud
- [ ] Set up automation triggers

---

## 👥 Stakeholders
- User (providing requirements)
- Jira System (source of user stories)
- LLM Service (generating test plans)

---

## 🔄 Workflow (Initial Understanding)
1. **Setup → LLM Connection Setup** (Ollama/GROQ/Grok + Test button)
2. **Setup → Jira Connection Setup** (Auth + Test button)
3. **Step 2:** Fetch Jira ID / User Story
4. **Step 3:** Generate Test Plan (using template + LLM context)
5. **Step 4:** Share/Export Test Plan
