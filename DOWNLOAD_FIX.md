# Download Fix: Files Now Stream to Browser Instead of .tmp Folder

## Problem
Previously, when exporting test plans to DOCX format:
- Files were saved in the `.tmp` folder on the server
- Users had to navigate to `.tmp` folder to find the downloaded file
- This wouldn't work in Vercel (serverless) since `.tmp` doesn't persist between requests
- User asked: "where the document should be downloaded" in Vercel

## Solution Implemented

### Backend Changes (server.js)
Modified the `/api/test-plan/download-docx` endpoint to:

1. **Generate DOCX in-memory** (via Python tool that saves temporarily)
2. **Read file as buffer** instead of using `res.download()`
3. **Stream directly to browser** with proper headers:
   ```javascript
   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
   res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
   res.send(fileBuffer)
   ```
4. **Clean up temporary file** immediately after streaming

### Frontend Behavior
The browser now:
- Receives the DOCX file as a blob stream
- Shows the native "Save As" dialog
- Saves to the user's **Downloads folder** (default browser behavior)
- File is named: `{IssueKey}_TestPlan.docx` (e.g., `SD-1_TestPlan.docx`)

## How It Works

### Local Development
```
User clicks Export
   ↓
Frontend sends test plan data to /api/test-plan/download-docx
   ↓
Backend generates DOCX to .tmp folder
   ↓
Backend reads file as buffer
   ↓
Backend streams buffer to browser with download headers
   ↓
Backend deletes .tmp file after streaming
   ↓
Browser shows Save As dialog
   ↓
User saves to Downloads folder
```

### Vercel (Serverless) Deployment
```
User clicks Export on Vercel app
   ↓
Frontend sends test plan data to /api/test-plan/download-docx
   ↓
Backend generates DOCX to Vercel's /tmp (ephemeral filesystem)
   ↓
Backend reads file as buffer
   ↓
Backend streams buffer to browser with download headers
   ↓
File is cleaned up (ephemeral /tmp doesn't persist anyway)
   ↓
Browser downloads file to user's Downloads folder
   ↓
✅ Works perfectly! No storage issues in serverless
```

## Key Benefits

✅ **Works in Vercel** - No persistent storage needed
✅ **Browser-native download** - File appears in Downloads folder
✅ **Streamlined UX** - No manual file location steps
✅ **Secure** - Files not accumulating on server
✅ **Scalable** - No disk I/O bottlenecks

## Testing Results

```
✅ Direct download endpoint working
✅ File streams to browser successfully
✅ Proper filename in download: SD-1_TestPlan.docx
✅ No files left in .tmp folder after download
✅ Works with both LLM and Jira connections
✅ Generated documents are valid DOCX files
✅ Watermarks removed (from Phase 1 fix)
```

## Code Changes

### Modified Files
1. **server.js** (lines 328-384)
   - Changed from `res.download()` to `res.send(fileBuffer)`
   - Added proper Content-Type and Content-Disposition headers
   - Ensured temp file cleanup after response

2. **frontend/src/components/GeneratePlan.jsx** (lines 70-130)
   - Already configured to use direct streaming endpoint
   - Handles blob response correctly
   - Triggers browser download with proper filename

## Browser Download Behavior

When you click "📄 Export DOCX":

1. **Browser shows Save As dialog** (native behavior)
2. **Default location** is your Downloads folder
3. **Default filename** is `SD-1_TestPlan.docx`
4. **You can** change location or filename before saving
5. **File opens** automatically if "always open after download" is enabled

## Verification

To verify the fix is working:
1. Click "Export DOCX" in the UI
2. Check browser console (should show "Document downloaded successfully!")
3. Check Downloads folder for `{IssueKey}_TestPlan.docx`
4. Open the DOCX file in Word/LibreOffice to verify content
5. Check that `.tmp` folder doesn't accumulate files

## Deployment Notes

### For Vercel
- No additional configuration needed
- The streaming approach works automatically
- Environment variables must be set (GROQ_API_KEY, JIRA credentials)
- Documents appear in user's browser Downloads folder

### For Local Development
- Run `npm run dev` in frontend directory
- Run `node server.js` in root directory
- Backend automatically streams downloads
- Cleanup happens automatically

## Future Enhancements

Optional improvements:
1. Add S3/cloud storage for document persistence
2. Add email delivery option
3. Add batch document generation
4. Add download history/log for auditing
