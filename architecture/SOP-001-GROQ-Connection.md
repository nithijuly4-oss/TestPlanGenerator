# SOP-001: GROQ API Connection & Test

## 📋 Goal
Establish and verify a reliable connection to GROQ API, validate authentication, and ensure the required model is available.

---

## 🎯 Input Requirements
- `GROQ_API_KEY`: String (from .env)
- `GROQ_MODEL`: String (from .env) - expected: `openai/gpt-oss-120b`

---

## ⚙️ Tool Logic

### Step 1: Initialize GROQ Client
- Create GROQ client instance with API key from environment variable
- Do NOT hardcode keys; always use .env

### Step 2: Test Connectivity (List Models)
- Call GROQ `/models` or equivalent endpoint
- Verify response status is 200 OK
- **Edge Case:** API key invalid → return 401
- **Edge Case:** Rate limited → return 429 (retry with exponential backoff)
- **Edge Case:** Network timeout → retry up to 3 times with 2s delay

### Step 3: Validate Required Model
- Check if `openai/gpt-oss-120b` is in available models list
- If model not found → Log warning but allow connection (model may be enabled later)
- If found → Confirm availability in response

### Step 4: Send Test Prompt
- Send minimal prompt: "Respond with 'GROQ connection successful'" 
- Verify response contains success message
- **Edge Case:** Model not found at inference time → Log error, suggest checking model availability
- **Edge Case:** Token limit exceeded → Not expected for test prompt

---

## 📤 Output Specification
```json
{
  "status": "connected" | "disconnected" | "error",
  "provider": "groq",
  "model": "openai/gpt-oss-120b",
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
- Retry on: 429 (rate limit), 5xx errors (server errors)
- Do NOT retry on: 401 (auth failure), 404 (not found)

---

## ✅ Success Criteria
- ✓ API key validation passes
- ✓ Model `openai/gpt-oss-120b` is available
- ✓ Test prompt receives successful response
- ✓ All in < 30 seconds

---

## ❌ Failure Handling
| Error Code | Cause | Action |
|-----------|-------|--------|
| 401 | Invalid API key | Return error, do NOT retry |
| 429 | Rate limited | Retry with exponential backoff |
| 5xx | Server error | Retry with exponential backoff |
| timeout | Network issue | Retry with exponential backoff |
| connection_error | DNS/network | Retry immediatelyonce |

---

## 🛠️ Implementation Notes
- Use `python-groq` or equivalent SDK
- Log all attempts for debugging
- Store connection result in session/cache (30-min TTL)
- Test button should return full result object to UI
